from pydantic import BaseModel, EmailStr, Field

class UserSignup(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    username: str
    phone_number: str
    password: str
    birthdate: str = "1900-01-01"  

class UserVerify(BaseModel):
    username: str
    confirmation_code: str

class UserSignin(BaseModel):
    username: str  
    password: str