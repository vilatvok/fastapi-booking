from datetime import datetime
from pydantic import BaseModel

from src.application.dtos.users import UserSchema


class ChatSchema(BaseModel):
    id: int
    first_user_id: int
    second_user_id: int


class MessageSchema(BaseModel):
    id: int
    chat_id: int
    sender: UserSchema
    content: str
    timestamp: datetime
