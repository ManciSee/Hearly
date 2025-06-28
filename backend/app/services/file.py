###

import os
from uuid import uuid4
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import HTTPException
from dotenv import load_dotenv
import logging
import json
import hashlib
import time
import mimetypes
import io
import tempfile
from decimal import Decimal
from mutagen import File as MutagenFile
from mutagen.mp3 import MP3
from mutagen.wave import WAVE
from mutagen.flac import FLAC
from mutagen.mp4 import MP4

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

aws_region = os.getenv("AWS_REGION", "").replace('"', '')
bucket_name = os.getenv("S3_BUCKET_NAME", "").replace('"', '')
output_bucket = os.getenv("S3_OUTPUT_BUCKET", "cc-transcribe-output")
dynamodb = boto3.resource('dynamodb', region_name=os.getenv("AWS_REGION", "").replace('"', ''))
files_table = dynamodb.Table('files')
try:
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=aws_region
    )
    s3.head_bucket(Bucket=bucket_name)
    logger.info(f"Connection to S3 established, bucket '{bucket_name}' accessible")
except Exception as e:
    logger.error(f"Errore nella configurazione di S3: {str(e)}")
    
###

async def save_file(file, username):
    file_id = str(uuid4())
    file_key = f"{username}/{file_id}_{file.filename}"
    extension = os.path.splitext(file.filename)[-1].lower()
    upload_time = int(time.time())
    file_bytes = await file.read()
    file.file.seek(0)  
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    duration_seconds = 0
    duration_seconds = get_audio_duration(file_bytes, file.filename)

    try:
        s3.upload_fileobj(
            file.file,
            bucket_name,
            file_key,
        )

        file_url = f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{file_key}"
        logger.info(f"File uploaded successfully: {file_key}")

        response=files_table.put_item(Item={
            'user_id': username,
            'file_id': file_id,
            'filename': file.filename,  
            'extension': extension,
            'upload_time': upload_time,
            'hash': sha256_hash,
            'duration': int(duration_seconds) if duration_seconds > 0 else None,
            'status': 'PENDING',
            'url': file_url  

        })
        logger.info(f"File metadata saved to DynamoDB: {response}")
        return {"filename": file.filename, "id": file_id, "url": file_url}
    
    except NoCredentialsError:
        logger.error("Invalid or missing AWS credentials")
        raise HTTPException(status_code=500, detail="Invalid or missing AWS credentials")
    
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'UnknownError')
        error_msg = e.response.get('Error', {}).get('Message', str(e))
        logger.error(f"Errore AWS ({error_code}): {error_msg}")
        
        if error_code == "AccessDenied":
            raise HTTPException(status_code=500, 
                detail="Access denied to AWS S3. Check bucket permissions.")
        elif error_code == "NoSuchBucket":
            raise HTTPException(status_code=500, 
                detail=f"The bucket '{bucket_name}' not exists")
        else:
            raise HTTPException(status_code=500, 
                detail=f"Errore durante il caricamento su S3: {error_msg}")
    except Exception as e:
        logger.error(f"Generic error while loading: {str(e)}")
        raise HTTPException(status_code=500, 
            detail=f"Error loading file: {str(e)}")

def list_uploaded_files(username):
    """
    Lista i file caricati da un utente leggendo da DynamoDB
    per ottenere tutti i metadati incluso lo status
    """
    try:
        response = files_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(username),
            ScanIndexForward=False  
        )
        
        files = []
        for item in response.get('Items', []):
            file_data = {
                "id": item['file_id'],
                "filename": item.get('filename', 'Unknown'),
                "status": item.get('status', 'UNKNOWN'),
                "upload_time": item.get('upload_time'),
                "extension": item.get('extension', ''),
                "duration": item.get('duration'),
                "url": item.get('url')
            }
            files.append(file_data)
        
        logger.info(f"Retrieved {len(files)} files for user {username}")
        return files
        
    except Exception as e:
        logger.error(f"Error retrieving files from DynamoDB: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving files: {str(e)}")
    
def update_file_status(username: str, file_id: str, status: str, duration: int = None):
    """
    Aggiorna lo status di un file in DynamoDB
    """
    try:
        update_expression = "SET #status = :status"
        expression_attribute_names = {"#status": "status"}
        expression_attribute_values = {":status": status}
        
        if duration is not None:
            update_expression += ", duration = :duration"
            expression_attribute_values[":duration"] = duration
        
        files_table.update_item(
            Key={
                'user_id': username,
                'file_id': file_id
            },
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        logger.info(f"Updated file {file_id} status to {status}")
        
    except Exception as e:
        logger.error(f"Error updating file status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating file status: {str(e)}")

def get_file_transcription(file_id: str, username: str):
    """ Recupera la trascrizione di un file da S3 e aggiorna i metadati in DynamoDB """

    output_bucket = os.getenv("S3_OUTPUT_BUCKET", "cc-transcribe-output")
    key = f"{username}/{file_id}.json"
    
    try:
        response = s3.get_object(Bucket=output_bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        transcription_data = json.loads(content)
        
        language = transcription_data.get('results', {}).get('language_code', 'und')
        transcript = ""
        if 'results' in transcription_data and 'transcripts' in transcription_data['results']:
            transcript = transcription_data['results']['transcripts'][0].get('transcript', '')
        
        files_table.update_item(
            Key={
                'user_id': username,
                'file_id': file_id
            },
            UpdateExpression="SET #lang = :language",
            ExpressionAttributeNames={"#lang": "language"},
            ExpressionAttributeValues={":language": language}
        )
        logger.info(f"Lingua rilevata salvata: {language} per file {file_id}")
        
        return {
            "transcription": transcript,
            "language": language,
            "status": "COMPLETED",
            "file_id": file_id
        }
    
    except s3.exceptions.NoSuchKey:
        return None
    except Exception as e:
        logger.error(f"Error retrieving transcript: {str(e)}")
        return {
            "transcription": f"Error retrieving transcription: {str(e)}",
            "status": "ERROR",
            "file_id": file_id
        }

async def save_transcription_result(file_id: str, username: str, transcription: str, detected_language: str = None):
    """
    Salva il risultato della trascrizione e aggiorna i metadati
    """
    try:
        update_expression = "SET #status = :status"
        expression_attribute_names = {"#status": "status"}
        expression_attribute_values = {":status": "COMPLETED"}
        
        if detected_language:
            update_expression += ", detected_language = :lang"
            expression_attribute_values[":lang"] = detected_language
        
        files_table.update_item(
            Key={'user_id': username, 'file_id': file_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values
        )
        
        logger.info(f"Transcription result saved for file {file_id}")
        
    except Exception as e:
        logger.error(f"Error saving transcription result: {str(e)}")
        raise

def get_audio_duration(file_bytes: bytes, filename: str) -> float:
    """
    Calcola la durata di un file audio in secondi
    """
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(filename)[1], delete=False) as temp_file:
            temp_file.write(file_bytes)
            temp_file.flush()
            temp_file_path = temp_file.name
        
        audio_file = MutagenFile(temp_file_path)
        
        if audio_file is not None and hasattr(audio_file, 'info'):
            duration = float(audio_file.info.length)
            logger.info(f"Durata rilevata per {filename}: {duration:.2f} secondi")
            return duration
        else:
            logger.warning(f"Impossibile rilevare la durata per {filename}")
            return 0.0
                
    except Exception as e:
        logger.error(f"Errore nel calcolo della durata per {filename}: {str(e)}")
        return 0.0
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as cleanup_error:
                logger.warning(f"Impossibile eliminare file temporaneo {temp_file_path}: {cleanup_error}")

def get_user_total_duration(username: str) -> dict:
    """
    Calcola la durata totale di tutti i file audio di un utente
    e restituisce la data di trascrizione dell'ultimo audio
    """
    try:
        response = files_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(username)
        )
        
        total_seconds = 0
        audio_files_count = 0
        latest_upload_time = 0
        
        for item in response.get('Items', []):
            if item.get('duration') and item.get('status') == 'COMPLETED':
                total_seconds += int(item['duration'])
                audio_files_count += 1
                
                upload_time = int(item.get('upload_time', 0))
                if upload_time > latest_upload_time:
                    latest_upload_time = upload_time
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        latest_transcription_date = None
        if latest_upload_time > 0:
            from datetime import datetime
            latest_transcription_date = datetime.fromtimestamp(latest_upload_time).strftime('%Y-%m-%d %H:%M:%S')
        
        return {
            "total_seconds": total_seconds,
            "total_formatted": f"{hours:02d}:{minutes:02d}:{seconds:02d}",
            "audio_files_count": audio_files_count,
            "latest_transcription_date": latest_transcription_date,
            "latest_transcription_timestamp": latest_upload_time if latest_upload_time > 0 else None
        }
        
    except Exception as e:
        logger.error(f"Error calculating total duration: {str(e)}")
        return {
            "total_seconds": 0,
            "total_formatted": "00:00:00",
            "audio_files_count": 0,
            "latest_transcription_date": None,
            "latest_transcription_timestamp": None
        }
