from fastapi import APIRouter, File, UploadFile, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse
import json
import os
import boto3
import logging
import time
from app.services.file import save_file, list_uploaded_files, get_file_transcription
from ..utils.auth import get_username_from_token
from boto3.dynamodb.conditions import Attr
from app.services import ServiceLLM

router = APIRouter()
dynamodb = boto3.resource('dynamodb', region_name=os.getenv("AWS_REGION", "").replace('"', ''))
files_table = dynamodb.Table('files')
lambda_client = boto3.client(
    'lambda',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

transcribe_client = boto3.client(
    'transcribe',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

logger = logging.getLogger(__name__)

@router.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    return await save_file(file, username)

@router.get("/files/")
def get_files(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    return list_uploaded_files(username)

@router.post("/transcribe/{file_id}")
async def transcribe_file(
    file_id: str,
    authorization: str = Header(None)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    
    try:
        bucket_name = os.getenv("S3_BUCKET_NAME", "cc-bucket-audio")
        s3 = boto3.client('s3')
        
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=f"{username}/{file_id}_")
        items = response.get("Contents", [])
        if not items:
            raise HTTPException(status_code=404, detail="File not found")
        
        file_key = items[0]["Key"]
        
        # Lambda payload
        payload = {
            "body": {
                "bucket": bucket_name,
                "key": file_key,
                "username": username
            }
        }
        
        # Invoke Lambda function
        lambda_response = lambda_client.invoke(
            FunctionName=os.getenv("LAMBDA_FUNCTION_NAME", "lambda-audio-transcribe"),
            InvocationType='RequestResponse',
            Payload=json.dumps(payload)
        )
        
        response_payload = json.loads(lambda_response['Payload'].read())
        
        if response_payload.get('statusCode') == 200:
            body = json.loads(response_payload.get('body', '{}'))
            return {
                "status": "processing",
                "job_name": body.get('job_name'),
                "file_id": file_id
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail="Error starting transcription"
            )
    
    except Exception as e:
        logger.error(f"Error in transcription request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in transcription request: {str(e)}")

@router.get("/transcription/{file_id}")
def get_transcription(
    file_id: str,
    authorization: str = Header(None),
    check_status: bool = Query(False)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    
    if check_status:
        try:
            # Try to get the recently transcription job 
            jobs_response = transcribe_client.list_transcription_jobs(
                MaxResults=100
            )
            
            # Search for the transcription job that matches the file_id
            target_key = f"{username}/{file_id}.json"
            matching_jobs = [
                job for job in jobs_response.get('TranscriptionJobSummaries', [])
                if job.get('OutputLocations', [{}])[0].get('OutputLocation', '').endswith(target_key)
            ]
            
            if matching_jobs:
                job = matching_jobs[0]
                status = job.get('TranscriptionJobStatus')
                
                if status == 'COMPLETED':
                    transcription = get_file_transcription(file_id, username)
                    if transcription:
                        return transcription
                    else:
                        return {"status": status, "message": "Trascrizione non ancora disponibile"}
                else:
                    return {"status": status, "message": f"Processing in progress: {status}"}
            
            transcription = get_file_transcription(file_id, username)
            if transcription:
                return transcription
            else:
                return {"status": "UNKNOWN", "message": "Job di trascrizione non trovato"}
                
        except Exception as e:
            logger.error(f"Error checking transcription status: {str(e)}")
            return {"status": "ERROR", "message": f"Error checking status: {str(e)}"}

    transcription = get_file_transcription(file_id, username)
    if transcription:
        return transcription
    
    return JSONResponse(status_code=404, content={"detail": "Trascrizione non trovata"})

@router.get("/summarize/{file_id}")
def summarize_transcription(
    file_id: str,
    authorization: str = Header(None),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    
    # Otteniamo prima la trascrizione
    transcription_data = get_file_transcription(file_id, username)
    
    if not transcription_data or not transcription_data.get("transcription"):
        return JSONResponse(status_code=404, content={"detail": "Trascrizione non trovata"})
    
    try:
        # Inizializziamo il service LLM
        llm_service = ServiceLLM()
        
        # Otteniamo il riassunto
        summary = llm_service.summarize(transcription_data["transcription"])
        
        # Restituiamo il riassunto
        return {
            "summary": summary,
            "file_id": file_id
        }
    
    except Exception as e:
        logger.error(f"Error in summarization request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in summarization request: {str(e)}")


@router.get("/users/{username}/language-distribution")
async def get_language_distribution(username: str):
    try:
        # Query per recuperare tutte le trascrizioni dell'utente con status 'completed'
        response = files_table.scan(
            FilterExpression=Attr("user_id").eq(username) & Attr("status").eq("COMPLETED")
        )
        items = response.get("Items", [])

        if not items:
            return JSONResponse(
                content={
                    "username": username,
                    "total_transcriptions": 0,
                    "languages": {},
                    "message": "Nessuna trascrizione completata trovata."
                }
            )

        # Conta totale trascrizioni
        total_transcriptions = len(items)

        # Calcola la distribuzione linguistica aggregando le trascrizioni
        language_counts = {}
        for item in items:
            lang = item.get("language", "unknown")
            language_counts[lang] = language_counts.get(lang, 0) + 1

        # Calcola percentuali
        language_distribution = {
            lang: round((count / total_transcriptions) * 100, 2)
            for lang, count in language_counts.items()
        }

        return JSONResponse(
            content={
                "username": username,
                "total_transcriptions": total_transcriptions,
                "languages": language_distribution,
                "message": "Dati ottenuti con successo"
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Errore interno al server: {str(e)}"},
        )

# @router.get("/summarize/{file_id}")
# def summarize_transcription(
#     file_id: str,
#     authorization: str = Header(None),
# ):
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing token")
    
#     token = authorization.split(" ")[1]
#     username = get_username_from_token(token)
    
#     # Otteniamo prima la trascrizione
#     transcription_data = get_file_transcription(file_id, username)
    
#     if not transcription_data or not transcription_data.get("transcription"):
#         return JSONResponse(status_code=404, content={"detail": "Trascrizione non trovata"})
    
#     try:
#         # Inizializziamo il service LLM
#         llm_service = ServiceLLM()
        
#         # Otteniamo il riassunto (anche se non viene salvato su S3)
#         summary = llm_service.summarize_and_save(
#             transcription=transcription_data["transcription"],
#             username=username,
#             file_id=file_id,
#         )
        
#         # Restituiamo il riassunto al frontend
#         return {
#             "summary": summary,
#             "file_id": file_id
#         }
    
#     except Exception as e:
#         logger.error(f"Error in summarization request: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Error in summarization request: {str(e)}")