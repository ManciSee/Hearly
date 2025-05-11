from jose import jwt
import os

def get_username_from_token(token: str) -> str:

    payload = jwt.get_unverified_claims(token)
    return payload.get("username") or payload.get("cognito:username")