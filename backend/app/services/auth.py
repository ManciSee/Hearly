##

from fastapi import HTTPException
from fastapi.responses import JSONResponse
import botocore
import logging

from ..controllers.cognito import AWSCognito
from ..models.user import UserSignup, UserVerify, UserSignin

# Configurazione del logger
logger = logging.getLogger(__name__)

class AuthService:
    def signup(user: UserSignup, cognito: AWSCognito):
        try:
            # Log dei dati di input (escludendo la password)
            logger.info(f"Tentativo di registrazione per: {user.email}")
            
            response = cognito.sign_up(user)
            
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                content = {
                    "message": "User signed up successfully",
                    "user_sub": response['UserSub'],
                    "username": response['username']  # Aggiungi l'username alla risposta
                }
                return JSONResponse(status_code=201, content=content)
            else:
                logger.error(f"Risposta da Cognito non valida: {response}")
                raise HTTPException(status_code=500, detail="Invalid response from authentication service")
                
        except botocore.exceptions.ParamValidationError as e:
            logger.error(f"Errore di validazione dei parametri: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Parameter validation error: {str(e)}")
            
        except botocore.exceptions.ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"AWS Cognito error: {error_code} - {error_message}")
            
            if error_code == 'UsernameExistsException':
                raise HTTPException(status_code=409, detail="Email already registered")
            elif error_code == 'InvalidParameterException':
                raise HTTPException(status_code=400, detail=error_message)
            elif error_code == 'InvalidPasswordException':
                raise HTTPException(status_code=400, detail="Password does not meet requirements")
            else:
                raise HTTPException(status_code=500, detail=f"Authentication service error: {error_message}")
                
        except Exception as e:
            logger.exception("Errore non previsto durante la registrazione")
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    def verify_account(data: UserVerify, cognito: AWSCognito):
        try:
            logger.info(f"Tentativo di verifica per username: {data.username}")
            
            response = cognito.verify_account(data.username, data.confirmation_code)
            
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                content = {
                    "message": "Account verified successfully"
                }
                return JSONResponse(status_code=200, content=content)
            else:
                logger.error(f"Risposta da Cognito non valida: {response}")
                raise HTTPException(status_code=500, detail="Invalid response from authentication service")
                
        except Exception as e:
            logger.exception(f"Errore durante la verifica dell'account: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        
    # def sign_in(data: UserSignin, cognito: AWSCognito):