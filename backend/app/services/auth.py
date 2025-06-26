##

from fastapi import HTTPException
from fastapi.responses import JSONResponse
import botocore
import boto3
import os

from ..controllers.cognito import AWSCognito
from ..models.user import UserSignup, UserVerify, UserSignin

dynamodb = boto3.resource('dynamodb', region_name=os.getenv("AWS_REGION", "").replace('"', ''))
users_table = dynamodb.Table('users')

class ServiceAuth:
    def signup(user: UserSignup, cognito: AWSCognito):
        try:
            response = cognito.sign_up(user)
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                users_table.put_item(Item={
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone_number": user.phone_number,
                    "birthdate": user.birthdate,
                })
                content = {
                    "message": "User signed up successfully",
                    "user_sub": response['UserSub'],
                    "username": user.username
                }
                return JSONResponse(status_code=201, content=content)
            else:
                raise HTTPException(status_code=500, detail="Invalid response from authentication service")
                
        except botocore.exceptions.ParamValidationError as e:
            raise HTTPException(status_code=400, detail=f"Parameter validation error: {str(e)}")
            
        except botocore.exceptions.ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            if error_code == 'UsernameExistsException':
                raise HTTPException(status_code=409, detail="Username or email already registered")
            elif error_code == 'InvalidParameterException':
                raise HTTPException(status_code=400, detail=error_message)
            elif error_code == 'InvalidPasswordException':
                raise HTTPException(status_code=400, detail="Password does not meet requirements")
            else:
                raise HTTPException(status_code=500, detail=f"Authentication service error: {error_message}")
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
    def verify_account(data: UserVerify, cognito: AWSCognito):
        try:
            response = cognito.verify_account(data.username, data.confirmation_code)
            
            if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                content = {
                    "message": "Account verified successfully"
                }
                return JSONResponse(status_code=200, content=content)
            else:
                raise HTTPException(status_code=500, detail="Invalid response from authentication service")
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    def signin(data: UserSignin, cognito: AWSCognito):
        try:
            response = cognito.sign_in(data.username, data.password)
            
            if 'AuthenticationResult' in response:
                content = {
                    "message": "Login successful",
                    "access_token": response['AuthenticationResult']['AccessToken'],
                    "refresh_token": response['AuthenticationResult'].get('RefreshToken'),
                    "id_token": response['AuthenticationResult']['IdToken'],
                    "expires_in": response['AuthenticationResult']['ExpiresIn'],
                    "token_type": response['AuthenticationResult']['TokenType']
                }
                return JSONResponse(status_code=200, content=content)
            else:
                raise HTTPException(status_code=500, detail="Invalid response from authentication service")
                
        except Exception as e:
            raise HTTPException(status_code=401, detail=str(e))