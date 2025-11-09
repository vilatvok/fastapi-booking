from typing import Annotated
from fastapi import APIRouter, Body, WebSocket, WebSocketDisconnect
from fastapi_pagination.async_paginator import paginate

from src.application.usecases.chats import ConnectionManager
from src.application.dtos.users import UserComplete, UserSchema
from src.application.dtos.chats import ChatSchema, MessageSchema
from src.presentation.api.dependencies.users import current_user
from src.presentation.api.dependencies.usecases import chat_usecase
from src.presentation.api.paginator import CustomPage


router = APIRouter()


@router.post('/', status_code=201)
async def create_chat(
    current_user: Annotated[UserComplete, current_user],
    chat_usecase: chat_usecase,
    user_id: Annotated[int, Body(embed=True)],
) -> ChatSchema:
    return await chat_usecase.create_chat(current_user.id, user_id)


@router.get('/')
async def get_chats(
    current_user: Annotated[UserComplete, current_user],
    chat_usecase: chat_usecase,
) -> CustomPage[ChatSchema]:
    chats = await chat_usecase.get_chats(current_user.id)
    return await paginate(chats)


@router.get('/id')
async def get_chat_id(
    user_id: int,
    current_user: Annotated[UserComplete, current_user],
    chat_usecase: chat_usecase,
) -> int:
    return await chat_usecase.get_chat_id(current_user.id, user_id)


@router.get('/{chat_id}')
async def get_chat(
    chat_id: int,
    current_user: Annotated[UserComplete, current_user],
    chat_usecase: chat_usecase,
) -> ChatSchema:
    return await chat_usecase.get_chat(current_user.id, chat_id)


@router.get('/{chat_id}/messages', dependencies=[current_user])
async def get_chat_messages(
    chat_id: int,
    chat_usecase: chat_usecase,
) -> CustomPage[MessageSchema]:
    messages = await chat_usecase.get_chat_messages(chat_id)
    return await paginate(messages)


@router.delete('/{chat_id}/clear')
async def clear_chat(chat_id: int, chat_usecase: chat_usecase) -> None:
    return await chat_usecase.clear_chat(chat_id)


@router.websocket('/{chat_id}')
async def websocket_endpoint(
    websocket: WebSocket,
    chat_id: int,
    token: str,
    chat_usecase: chat_usecase,
) -> None:
    sender: UserSchema = await chat_usecase.get_sender(token)
    manager: ConnectionManager = chat_usecase.get_connection_manager()
    
    await manager.connect(websocket, chat_id)
    try:
        while True:
            data = await manager.receive_message(websocket)
            msg_data = {
                'chat_id': chat_id,
                'sender': sender.model_dump(),
                'content': data['content'],
            }
            await manager.send_message(msg_data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, chat_id)
