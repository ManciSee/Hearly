###
from fastapi import APIRouter, File, UploadFile, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse
import json
import os
import boto3
import time
from app.services.file import save_file, list_uploaded_files, get_file_transcription, get_user_total_duration
from ..utils.auth import get_username_from_token
from boto3.dynamodb.conditions import Attr
from app.services import ServiceLLM
from botocore.exceptions import ClientError
from datetime import datetime, timedelta
from collections import defaultdict
from decimal import Decimal
from dotenv import load_dotenv

###

load_dotenv()

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
    
    try:
        files_data = list_uploaded_files(username)
        
        bucket_name = os.getenv("S3_BUCKET_NAME", "").replace('"', '')
        
        for file in files_data:
            if file.get('url'):
                object_key = f"{username}/{file['id']}_{file['filename']}"
                signed_url = generate_presigned_url(bucket_name, object_key, expiration=7200)  # 2 ore
                
                if signed_url:
                    file['url'] = signed_url
                else:
                    file['url'] = None
                
        return files_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Errore nel recupero dei file")

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
        try:
            response = files_table.get_item(
                Key={
                    'user_id': username,
                    'file_id': file_id
                }
            )
            
            if 'Item' not in response:
                raise HTTPException(status_code=404, detail="File not found in database")
                
            file_item = response['Item']
            filename = file_item.get('filename')
            
            if not filename:
                raise HTTPException(status_code=404, detail="Filename not found in database")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error retrieving file metadata")
        
        bucket_name = os.getenv("S3_BUCKET_NAME", "cc-bucket-audio")
        file_key = f"{username}/{file_id}_{filename}"
        
        s3 = boto3.client('s3')
        try:
            s3.head_object(Bucket=bucket_name, Key=file_key)
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise HTTPException(status_code=404, detail=f"File not found in S3: {file_key}")
            else:
                raise HTTPException(status_code=500, detail=f"Error accessing S3: {str(e)}")
        
        payload = {
            "body": {
                "bucket": bucket_name,
                "key": file_key,
                "username": username
            }
        }
        
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
                "file_id": file_id,
                "file_key": file_key  
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail="Error starting transcription"
            )
    
    except HTTPException:
        raise
    except Exception as e:
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
            jobs_response = transcribe_client.list_transcription_jobs(
                MaxResults=100
            )
            
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
                        return {"status": status, "message": "Trascrizione in corso..."}
                else:
                    return {"status": status, "message": f"Processing in progress: {status}"}
            
            transcription = get_file_transcription(file_id, username)
            if transcription:
                return transcription
            else:
                return {"status": "UNKNOWN", "message": "Trascrizione in corso..."}
                
        except Exception as e:
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
    
    transcription_data = get_file_transcription(file_id, username)
    
    if not transcription_data or not transcription_data.get("transcription"):
        return JSONResponse(status_code=404, content={"detail": "Trascrizione non trovata"})
    
    try:
        llm_service = ServiceLLM()
        
        summary = llm_service.summarize_and_save(
            transcription_data["transcription"], 
            username, 
            file_id
        )
        
        return {
            "summary": summary,
            "file_id": file_id
        }
    
    except Exception as e:
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

        total_transcriptions = len(items)

        language_counts = {}
        for item in items:
            lang = item.get("language", "unknown")
            language_counts[lang] = language_counts.get(lang, 0) + 1

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

@router.get("/users/{username}/total-duration")
async def get_total_duration(username: str):
    return get_user_total_duration(username)


def generate_presigned_url(bucket_name: str, object_key: str, expiration: int = 3600):
    """
    Genera un URL firmato per accedere a un oggetto S3
    """
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "").replace('"', '')
        )
        
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': object_key},
            ExpiresIn=expiration
        )
        return response
    except ClientError as e:
        return None
    
@router.get("/users/{username}/recent-activity")
async def get_recent_activity(username: str):
    """
    Restituisce l'attività degli upload degli ultimi 30 giorni
    """
    try:
        
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        thirty_days_ago_timestamp = int(thirty_days_ago.timestamp())
        
        response = files_table.scan(
            FilterExpression=Attr("user_id").eq(username) & Attr("upload_time").gte(thirty_days_ago_timestamp)
        )
        items = response.get("Items", [])
        
        daily_counts = defaultdict(int)
        
        for i in range(30):
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
            daily_counts[date] = 0
        
        for item in items:
            upload_timestamp = item.get("upload_time")
            if upload_timestamp:
                if isinstance(upload_timestamp, Decimal):
                    upload_timestamp = int(upload_timestamp)
                
                upload_date = datetime.fromtimestamp(upload_timestamp).strftime('%Y-%m-%d')
                daily_counts[upload_date] += 1
        
        activity_data = []
        for i in range(29, -1, -1):  # Dal più vecchio al più recente
            date = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
            day_name = (datetime.utcnow() - timedelta(days=i)).strftime('%d/%m')
            activity_data.append({
                "date": date,
                "day": day_name,
                "uploads": daily_counts[date]
            })
        
        total_uploads_30_days = sum(daily_counts.values())
        days_with_activity = sum(1 for count in daily_counts.values() if count > 0)
        
        return {
            "username": username,
            "period_days": 30,
            "activity_data": activity_data,
            "total_uploads": total_uploads_30_days,
            "active_days": days_with_activity,
            "message": "Dati attività recuperati con successo"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Errore interno al server: {str(e)}"}
        )

@router.post("/files/{file_id}/delete")
async def delete_file(
    file_id: str,
    authorization: str = Header(None)
):
    """
    Elimina un file specifico dell'utente sia da S3 che da DynamoDB
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.split(" ")[1]
    username = get_username_from_token(token)
    
    try:
        try:
            response = files_table.get_item(
                Key={
                    'user_id': username,
                    'file_id': file_id
                }
            )
            
            if 'Item' not in response:
                raise HTTPException(status_code=404, detail="File not found")
                
            file_item = response['Item']
            filename = file_item.get('filename')
            
            if not filename:
                raise HTTPException(status_code=404, detail="Filename not found in database")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error retrieving file metadata")
        
        bucket_name = os.getenv("S3_BUCKET_NAME", "cc-bucket-audio")
        file_key = f"{username}/{file_id}_{filename}"
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "").replace('"', '')
        )
        
        try:
            s3_client.head_object(Bucket=bucket_name, Key=file_key)
            s3_client.delete_object(Bucket=bucket_name, Key=file_key)
            
        except Exception as e:
            if hasattr(e, 'response') and e.response.get('Error', {}).get('Code') == '404':
                pass
            else:
                raise HTTPException(status_code=500, detail=f"Error deleting file from S3: {str(e)}")
        
        transcription_key = f"{username}/{file_id}.json"
        try:
            s3_client.head_object(Bucket=bucket_name, Key=transcription_key)
            s3_client.delete_object(Bucket=bucket_name, Key=transcription_key)
        except Exception as e:
            if hasattr(e, 'response') and e.response.get('Error', {}).get('Code') == '404':
                pass
        
        try:
            files_table.delete_item(
                Key={
                    'user_id': username,
                    'file_id': file_id
                }
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error deleting file record from database")
        

        return {
            "message": "File deleted successfully",
            "file_id": file_id,
            "filename": filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error in file deletion: {str(e)}")