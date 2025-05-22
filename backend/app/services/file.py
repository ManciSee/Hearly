# import os
# from uuid import uuid4
# import boto3
# from botocore.exceptions import NoCredentialsError, ClientError
# from fastapi import HTTPException
# from dotenv import load_dotenv
# import logging

# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# load_dotenv()

# aws_region = os.getenv("AWS_REGION", "").replace('"', '')
# bucket_name = os.getenv("S3_BUCKET_NAME", "").replace('"', '')

# try:
#     s3 = boto3.client(
#         's3',
#         aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
#         aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
#         region_name=aws_region
#     )
#     s3.head_bucket(Bucket=bucket_name)
#     logger.info(f"Connessione a S3 stabilita, bucket '{bucket_name}' accessibile")
# except Exception as e:
#     logger.error(f"Errore nella configurazione di S3: {str(e)}")
    
# async def save_file(file, username):
#     file_id = str(uuid4())
#     file_key = f"{username}/{file_id}_{file.filename}"

#     try:
#         s3.upload_fileobj(
#             file.file,
#             bucket_name,
#             file_key,
#         )

#         file_url = f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{file_key}"
#         logger.info(f"File caricato con successo: {file_key}")

#         return {"filename": file.filename, "id": file_id, "url": file_url}
    
#     except NoCredentialsError:
#         logger.error("Credenziali AWS non valide o mancanti")
#         raise HTTPException(status_code=500, detail="Credenziali AWS non valide o mancanti")
    
#     except ClientError as e:
#         error_code = e.response.get('Error', {}).get('Code', 'UnknownError')
#         error_msg = e.response.get('Error', {}).get('Message', str(e))
#         logger.error(f"Errore AWS ({error_code}): {error_msg}")
        
#         if error_code == "AccessDenied":
#             raise HTTPException(status_code=500, 
#                 detail="Accesso negato ad AWS S3. Verificare le autorizzazioni del bucket.")
#         elif error_code == "NoSuchBucket":
#             raise HTTPException(status_code=500, 
#                 detail=f"Il bucket '{bucket_name}' non esiste")
#         else:
#             raise HTTPException(status_code=500, 
#                 detail=f"Errore durante il caricamento su S3: {error_msg}")
#     except Exception as e:
#         logger.error(f"Errore generico durante il caricamento: {str(e)}")
#         raise HTTPException(status_code=500, 
#             detail=f"Errore durante il caricamento del file: {str(e)}")

# def list_uploaded_files(username):
#     try:
#         response = s3.list_objects_v2(Bucket=bucket_name, Prefix=f"{username}/")
#         files = []
#         for obj in response.get('Contents', []):
#             key = obj['Key']
#             if "/" in key and "_" in key:
#                 _, file_id_filename = key.split("/", 1)
#                 file_id, filename = file_id_filename.split("_", 1)
#                 file_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
#                 files.append({"id": file_id, "filename": filename, "url": file_url})
#         return files
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# def get_file_transcription(file_id: str):

#     # Placeholder per la trascrizione
#     return {"id": file_id, "transcription": f"Trascrizione per il file {file_id}"}
    

"""
Lambda function to handle file uploads and transcriptions
"""
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
    
async def save_file(file, username):
    file_id = str(uuid4())
    file_key = f"{username}/{file_id}_{file.filename}"
    extension = os.path.splitext(file.filename)[-1].lower()
    upload_time = int(time.time())
# Leggi contenuto per calcolare hash
    file_bytes = await file.read()
    file.file.seek(0)  # reset puntatore
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()

    try:
        s3.upload_fileobj(
            file.file,
            bucket_name,
            file_key,
        )

        file_url = f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{file_key}"
        logger.info(f"File uploaded successfully: {file_key}")
         # Salvataggio su DynamoDB
        response=files_table.put_item(Item={
            'user_id': username,
            'file_id': file_id,
            'filename': file.filename,  # Aggiungo il filename per comodità
            'extension': extension,
            'upload_time': upload_time,
            'hash': sha256_hash,
            'duration': None,
            'status': 'PENDING',
            'url': file_url  # Aggiungo anche l'URL per comodità

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
        # Query DynamoDB per ottenere tutti i file dell'utente
        response = files_table.query(
            KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(username),
            ScanIndexForward=False  # Ordina per upload_time decrescente (più recenti prima)
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
    """
    Retrieve the transcription for a given file ID from S3.
    """
    output_bucket = os.getenv("S3_OUTPUT_BUCKET", "cc-transcribe-output")
    key = f"{username}/{file_id}.json"
    
    try:
        response = s3.get_object(Bucket=output_bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        transcription_data = json.loads(content)
        
        # Extract the transcription from the JSON data
        if 'results' in transcription_data and 'transcripts' in transcription_data['results']:
            transcript = transcription_data['results']['transcripts'][0]['transcript']
            return {
                "transcription": transcript,
                "status": "COMPLETED",
                "file_id": file_id
            }
        else:
            return {
                "transcription": "The transcript format is invalid",
                "status": "ERROR",
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