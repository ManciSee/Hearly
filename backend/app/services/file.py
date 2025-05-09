import os
from uuid import uuid4
from boto3 import client
from botocore.exceptions import NoCredentialsError, ClientError
from fastapi import HTTPException
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

aws_region = os.getenv("AWS_REGION", "").replace('"', '')
bucket_name = os.getenv("S3_BUCKET_NAME", "").replace('"', '')

try:
    s3 = client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=aws_region
    )
    s3.head_bucket(Bucket=bucket_name)
    logger.info(f"Connessione a S3 stabilita, bucket '{bucket_name}' accessibile")
except Exception as e:
    logger.error(f"Errore nella configurazione di S3: {str(e)}")
    
async def save_file(file):
    file_id = str(uuid4())
    file_key = f"{file_id}_{file.filename}"

    try:
        s3.upload_fileobj(
            file.file,
            bucket_name,
            file_key,
        )

        file_url = f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{file_key}"
        logger.info(f"File caricato con successo: {file_key}")

        return {"filename": file.filename, "id": file_id, "url": file_url}
    
    except NoCredentialsError:
        logger.error("Credenziali AWS non valide o mancanti")
        raise HTTPException(status_code=500, detail="Credenziali AWS non valide o mancanti")
    
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'UnknownError')
        error_msg = e.response.get('Error', {}).get('Message', str(e))
        logger.error(f"Errore AWS ({error_code}): {error_msg}")
        
        if error_code == "AccessDenied":
            raise HTTPException(status_code=500, 
                detail="Accesso negato ad AWS S3. Verificare le autorizzazioni del bucket.")
        elif error_code == "NoSuchBucket":
            raise HTTPException(status_code=500, 
                detail=f"Il bucket '{bucket_name}' non esiste")
        else:
            raise HTTPException(status_code=500, 
                detail=f"Errore durante il caricamento su S3: {error_msg}")
    except Exception as e:
        logger.error(f"Errore generico durante il caricamento: {str(e)}")
        raise HTTPException(status_code=500, 
            detail=f"Errore durante il caricamento del file: {str(e)}")

def list_uploaded_files():
    try:
        response = s3.list_objects_v2(Bucket=bucket_name)
        files = []
        for obj in response.get('Contents', []):
            key = obj['Key']
            if "_" in key:
                file_id, filename = key.split("_", 1)
                file_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{key}"
                files.append({"id": file_id, "filename": filename, "url": file_url})
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_file_transcription(file_id: str):
    # Placeholder per la trascrizione
    return {"id": file_id, "transcription": f"Trascrizione per il file {file_id}"}
