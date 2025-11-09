from typing import Annotated
from fastapi import APIRouter, Form, status
from fastapi_pagination.async_paginator import paginate

from src.presentation.api.paginator import CustomPage
from src.application.dtos.users import UserComplete
from src.application.dtos.offers import (
    FeedbackCreate,
    OfferUnitSchema,
    OfferCreate,
    OfferCreateOutput,
    OfferSchema,
    OfferUpdate,
)
from src.presentation.api.dependencies.users import current_user
from src.presentation.api.dependencies.offers import current_offer, offer_owner
from src.presentation.api.dependencies.usecases import offer_usecase


router = APIRouter()


@router.get('/')
async def get_offers(offer_usecase: offer_usecase) -> CustomPage[OfferSchema]:
    offers = await offer_usecase.get_offers()
    return await paginate(offers)


@router.get('/{offer_id}')
async def get_offer(offer_id: int, offer_usecase: offer_usecase) -> OfferUnitSchema:
    return await offer_usecase.get_offer(offer_id)


@router.post('/', status_code=status.HTTP_201_CREATED)
async def create_offer(
    current_user: Annotated[UserComplete, current_user],
    form_data: Annotated[OfferCreate, Form(media_type="multipart/form-data")],
    offer_usecase: offer_usecase,
) -> OfferCreateOutput:
    return await offer_usecase.create_offer(current_user.id, form_data)


@router.patch(
    path='/{offer_id}',
    status_code=status.HTTP_202_ACCEPTED,
    dependencies=[offer_owner],
)
async def update_offer(
    offer: Annotated[OfferSchema, current_offer],
    form_data: OfferUpdate,
    offer_usecase: offer_usecase,
) -> OfferUpdate:
    return await offer_usecase.update_offer(offer.id, form_data)


@router.delete(
    path='/{offer_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[offer_owner],
)
async def delete_offer(
    offer: Annotated[OfferSchema, current_offer],
    offer_usecase: offer_usecase,
):  
    return await offer_usecase.delete_offer(offer.id)


@router.post('/{offer_id}/feedback', status_code=status.HTTP_201_CREATED)
async def create_feedback(
    current_user: Annotated[UserComplete, current_user],
    offer: Annotated[OfferSchema, current_offer],
    form_data: FeedbackCreate,
    offer_usecase: offer_usecase,
) -> FeedbackCreate:
    data = form_data.model_dump()
    data['user_id'] = current_user.id
    data['offer_id'] = offer.id
    return await offer_usecase.create_feedback(data)
