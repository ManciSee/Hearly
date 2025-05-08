from pydantic import BaseModel, EmailStr, Field

class UserSignup(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: str
    password: str
    birthdate: str = "1900-01-01"  # Formato YYYY-MM-DD, campo obbligatorio

class UserVerify(BaseModel):
    username: str
    confirmation_code: str

class UserSignin(BaseModel):
    username: str
    password: str