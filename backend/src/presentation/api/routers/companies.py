from typing import Annotated
from fastapi import Form, status, APIRouter
from fastapi_pagination.async_paginator import paginate

from src.application.dtos.offers import OfferSchema
from src.application.dtos.users import UserComplete
from src.application.dtos.companies import (
    CompanyRegister,
    CompanySchema,
    CompanyUpdate,
)
from src.presentation.api.dependencies.usecases import company_usecase
from src.presentation.api.dependencies.users import current_user
from src.presentation.api.paginator import CustomPage


router = APIRouter()


@router.post('/register', status_code=status.HTTP_200_OK)
async def registration(
    current_user: Annotated[UserComplete, current_user],
    company_usecase: company_usecase,
    form_data: Annotated[CompanyRegister, Form(media_type="multipart/form-data")],
) -> CompanySchema:
    return await company_usecase.register_company(current_user.id, form_data)


@router.get('/')
async def get_companies(
    company_usecase: company_usecase,
) -> CustomPage[CompanySchema]:
    companies = await company_usecase.get_companies()
    return await paginate(companies)


@router.get('/{name}')
async def get_company(
    name: str,
    company_usecase: company_usecase
) -> CompanySchema:
    return await company_usecase.get_company(name)


@router.get('/{name}/offers')
async def get_company_offers(
    name: str,
    company_usecase: company_usecase
) -> CustomPage[OfferSchema]:
    offers = await company_usecase.get_company_offers(name)
    return await paginate(offers)


@router.patch('/me', status_code=status.HTTP_202_ACCEPTED)
async def update_company(
    company_usecase: company_usecase,
    current_user: Annotated[UserComplete, current_user],
    form_data: Annotated[CompanyUpdate, Form(media_type="multipart/form-data")],
) -> CompanySchema:
    return await company_usecase.update_company(current_user.id, form_data)


@router.delete('/me', status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_usecase: company_usecase,
    current_user: Annotated[UserComplete, current_user],
):
    return await company_usecase.delete_company(current_user.id)
