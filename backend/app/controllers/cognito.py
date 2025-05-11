import os
import boto3
import hmac
import hashlib
import base64
import uuid
from app.models.user import UserSignup
from dotenv import load_dotenv


load_dotenv()

AWS_REGION_NAME = os.getenv("AWS_REGION", "").replace('"', '')
AWS_COGNITO_APP_CLIENT_ID = os.getenv("AWS_COGNITO_APP_CLIENT_ID", "").replace('"', '')
AWS_COGNITO_USER_POOL_ID = os.getenv("AWS_COGNITO_USER_POOL_ID", "").replace('"', '')
AWS_COGNITO_CLIENT_SECRET = os.getenv("AWS_COGNITO_CLIENT_SECRET", "").replace('"', '')

class AWSCognito:
    def __init__(self):
        self.client = boto3.client('cognito-idp', region_name=AWS_REGION_NAME)
        self.client_id = AWS_COGNITO_APP_CLIENT_ID
        self.client_secret = AWS_COGNITO_CLIENT_SECRET
        
    def _calculate_secret_hash(self, username):
        """
        Calculate SECRET_HASH using HMAC SHA256
        """
        message = username + self.client_id
        dig = hmac.new(
            key=self.client_secret.encode('utf-8'),
            msg=message.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()

    def sign_up(self, user: UserSignup):
        username = user.username
        secret_hash = self._calculate_secret_hash(username)
        
        user_attributes = [
            {
                'Name': 'email',
                'Value': user.email
            },
            {
                'Name': 'phone_number',
                'Value': user.phone_number
            },
            {
                'Name': 'given_name',
                'Value': user.first_name
            },
            {
                'Name': 'family_name',
                'Value': user.last_name
            },
            {
            'Name': 'name',
            'Value': f"{user.first_name} {user.last_name}"
            }
        ]
        
        
        birthdate = getattr(user, 'birthdate', '1900-01-01')
        user_attributes.append({
            'Name': 'birthdate',
            'Value': birthdate
        })
        
        response = self.client.sign_up(
            ClientId=self.client_id,
            Username=username,
            Password=user.password,
            SecretHash=secret_hash,
            UserAttributes=user_attributes,
        )

        return response
    
    def verify_account(self, username: str, confirmation_code: str):
        """
        Verify user account via confirmation code
        """
        secret_hash = self._calculate_secret_hash(username)
        
        try:
            response = self.client.confirm_sign_up(
                ClientId=self.client_id,
                Username=username,
                ConfirmationCode=confirmation_code,
                SecretHash=secret_hash
            )
            return response
        except self.client.exceptions.CodeMismatchException:
            raise Exception("Invalid verification code")
        except self.client.exceptions.ExpiredCodeException:
            raise Exception("Verification code has expired")
        except self.client.exceptions.UserNotFoundException:
            raise Exception("User not found")
        except Exception as e:
            raise Exception(f"Error while verifying account: {str(e)}")

    def sign_in(self, username: str, password: str):
        """
        Log in user
        """
        secret_hash = self._calculate_secret_hash(username)
        
        try:
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': password,
                    'SECRET_HASH': secret_hash
                }
            )
            return response
        except self.client.exceptions.UserNotFoundException:
            raise Exception("User not found")
        except self.client.exceptions.NotAuthorizedException:
            raise Exception("Invalid credentials")
        except self.client.exceptions.UserNotConfirmedException:
            raise Exception("Account not verified")
        except Exception as e:
            raise Exception(f"Error while logging in: {str(e)}")