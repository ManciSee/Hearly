from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.file import save_file, list_uploaded_files, get_file_transcription

router = APIRouter()

@router.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_data = await save_file(file)
        return file_data
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/files/")
def list_files():
    return list_uploaded_files()

@router.get("/transcription/{file_id}")
def get_transcription(file_id: str):
    transcription = get_file_transcription(file_id)
    if transcription:
        return transcription
    return JSONResponse(status_code=404, content={"detail": "File non trovato"})
