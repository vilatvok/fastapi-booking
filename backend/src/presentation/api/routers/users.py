from typing import Annotated
from fastapi import Form, status, APIRouter, Depends
from fastapi.background import BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from fastapi_pagination.async_paginator import paginate

from src.application.dtos.users import (
    PasswordReset,
    PasswordResetConfirm,
    PasswordChange,
    UserComplete,
    UserSchema,
    UserUpdate,
)
from src.application.dtos.offers import OfferSchema
from src.presentation.api.dependencies.usecases import user_usecase
from src.presentation.api.dependencies.users import (
    anonymous_user,
    current_user,
    user_oauth2_scheme,
)
from src.presentation.api.paginator import CustomPage


router = APIRouter()


@router.get('/')
async def get_users(user_usecase: user_usecase) -> CustomPage[UserSchema]:
    data = await user_usecase.get_users()
    return await paginate(data)


@router.get('/{username}')
async def get_user(
    username: str,
    user_usecase: user_usecase
) -> UserComplete:
    return await user_usecase.get_user(username)


@router.get('/{username}/offers')
async def get_user_offers(
    username: str,
    user_usecase: user_usecase,
) -> CustomPage[OfferSchema]:
    offers = await user_usecase.get_user_offers(username)
    return await paginate(offers)


@router.patch(
    path='/me',
    status_code=status.HTTP_202_ACCEPTED,
)
async def update_user(
    user_usecase: user_usecase,
    current_user: Annotated[UserComplete, current_user],
    form_data: Annotated[UserUpdate, Form(media_type="multipart/form-data")],
) -> UserSchema:  
    return await user_usecase.update_user(current_user.id, form_data)


@router.delete('/me', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_usecase: user_usecase,
    current_user: Annotated[UserComplete, current_user],
    token: Annotated[OAuth2PasswordBearer, Depends(user_oauth2_scheme)],
):
    return await user_usecase.delete_user(current_user.id, token)


@router.delete('/reset-avatar', status_code=status.HTTP_204_NO_CONTENT)
async def reset_avatar(
    user_usecase: user_usecase,
    current_user: Annotated[UserComplete, current_user],
):
    return await user_usecase.reset_avatar(current_user.id)


@router.put('/password', status_code=status.HTTP_202_ACCEPTED)
async def change_password(
    current_user: Annotated[UserComplete, current_user],
    form_data: PasswordChange,
    user_usecase: user_usecase,
) -> dict:
    return await user_usecase.change_password(current_user, form_data)


@router.post(
    path='/password-reset',
    status_code=202,
    dependencies=[anonymous_user],
)
async def password_reset(
    form_data: PasswordReset,
    user_usecase: user_usecase,
    background: BackgroundTasks,
) -> dict:
    response = await user_usecase.password_reset(form_data)
    background.add_task(user_usecase.send_password_reset, response['token'])
    return response['message']


@router.patch(
    path='/password-reset/{token}',
    status_code=200,
    dependencies=[anonymous_user],
)
async def password_reset_confirm(
    token: str,
    form_data: PasswordResetConfirm,
    user_usecase: user_usecase,
) -> dict:
    return await user_usecase.password_reset_confirm(token, form_data)
