##

from fastapi import APIRouter, Depends, status

from ..models.user import UserSignup, UserVerify
from ..services.auth import AuthService
from ..controllers.cognito import AWSCognito

def get_aws_cognito():
    return AWSCognito()

auth_router = APIRouter(prefix='/api/v1/auth')

@auth_router.post('/signup', status_code=status.HTTP_201_CREATED, tags=['Auth'])
async def signup(user: UserSignup, cognito: AWSCognito = Depends(get_aws_cognito)):
    return AuthService.signup(user, cognito)

@auth_router.post('/verify', status_code=status.HTTP_200_OK, tags=['Auth'])
async def verify_account(data: UserVerify, cognito: AWSCognito = Depends(get_aws_cognito)):
    return AuthService.verify_account(data, cognito)

# @auth_router.post()
# async def signin():
#     pass