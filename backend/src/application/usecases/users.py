import httpx

from src.application.exceptions import (
    AlreadyExistsError,
    NotFoundError,
    ValidationError,
    InvalidDataError,
)
from src.application.dtos.users import (
    Token,
    RefreshToken,
    UserComplete,
    UserRegister,
    UserSchema,
    UserUpdate,
    UserSocialRegister,
    PasswordReset,
    PasswordResetConfirm,
    PasswordChange,
)
from src.application.dtos.companies import (
    CompanySchema,
    CompanyUpdate,
    CompanyRegister,
)
from src.application.utils.common import generate_image_path
from src.application.utils.offers import format_offer
from src.application.utils.users import PasswordService, prepare_image_data
from src.application.interfaces.services.tokens import ITokenService
from src.application.interfaces.services.tasks import IBackgroundTasksService
from src.application.interfaces.repositories.base import IRedisRepository
from src.application.interfaces.repositories.users import (
    ICompanyRepository,
    IUserRepository,
)


class UserUseCase:

    def __init__(
        self,
        repository: IUserRepository,
        redis_repo: IRedisRepository,
        token_service: ITokenService,
        background_service: IBackgroundTasksService,
    ):
        self.repository = repository
        self.redis_repo = redis_repo
        self.token_service = token_service
        self.background_service = background_service

    async def registration(self, data: UserRegister) -> dict:
        input_data = data.model_dump(exclude_unset=True)
        input_data['password'] = PasswordService.generate(data.password)

        if data.avatar:
            image = {
                'path': 'media/users/',
                'image': data.avatar,
                'username': data.username
            }
            input_data['avatar'] = await prepare_image_data(image)

        async with self.repository.uow:
            user = await self.repository.add(input_data)

        response = {'status': 'Check your email for confirmation letter.'}
        token_data = {'user_id': user.id, 'email': data.email}
        return {'message': response, 'token_data': token_data}

    async def confirm_registration(self, token: str) -> UserSchema:
        data = await self.token_service.decode(token)
        user_id = data['user_id']

        user = await self.repository.retrieve(id=user_id)
        if user.is_active:
            raise AlreadyExistsError('User is already active')

        async with self.repository.uow:
            user = await self.repository.update({'is_active': True}, id=user_id)
        return UserSchema(**user.to_dict())

    async def login(self, username: str, password: str) -> Token:
        user = await self.get_user(username)

        if user.provider != 'local':
            raise InvalidDataError('User is registered with social provider')
        PasswordService.check(password, user.password)

        jwt_data = {'id': user.id, 'username': user.username}

        # * 120 MINUTES FOR DEV MODE
        # !
        access = self.token_service.encode(jwt_data, exp_time=120)
        refresh = self.token_service.encode(jwt_data, exp_time=1440)
        return Token(access_token=access, refresh_token=refresh)

    async def logout(self, token: str) -> dict:
        await self.token_service.decode(token)
        await self.redis_repo.sadd('jwt_blacklist', token)
        return {'status': 'You logged out'}

    async def update_token(self, form_data: RefreshToken) -> Token:
        refresh = form_data.refresh_token
        token_data = await self.token_service.decode(refresh, self.redis_repo)

        if form_data.username:
            token_data['username'] = form_data.username
    
            access = self.token_service.encode(token_data)
            refresh = self.token_service.encode(token_data, exp_time=1440)
            return Token(access_token=access, refresh_token=refresh)
        else:
            access = self.token_service.encode(token_data)
            return Token(access_token=access)

    async def get_users(self) -> list[UserSchema]:
        users = await self.repository.list()
        return [UserSchema(**user.to_entity().to_dict()) for user in users]

    async def get_user(self, username: str) -> UserComplete:
        user = await self.repository.retrieve(username=username)
        return UserComplete(**user.to_dict())

    async def get_user_data(self, token: str) -> dict:
        token_data = await self.token_service.decode(token, rdb=self.redis_repo)
        return token_data

    async def get_user_offers(self, data: str) -> list[dict]:
        owner = await self.repository.get_user_offers(data)
        offers = owner.offers
        response_data = []
        for offer in offers:
            formatted = format_offer(offer, owner.username)
            response_data.append(formatted)
        return response_data

    async def update_user(self, user_id: int, data: UserUpdate) -> UserSchema:
        async with self.repository.uow:
            input_data = data.model_dump(exclude_unset=True)
            if data.avatar:
                avatar = data.avatar
                path = 'media/users/' + avatar.filename
                input_data['avatar'] = await generate_image_path(
                    path=path,
                    image=avatar,
                    content_type=avatar.content_type,
                )
            response = await self.repository.update(input_data, id=user_id)
        return UserSchema(**response.to_dict())
    
    async def reset_avatar(self, user_id: int) -> dict:
        async with self.repository.uow:
            default_avatar = 'static/img/user_logo.png'
            await self.repository.update({'avatar': default_avatar}, id=user_id)
        return {'status': 'Avatar has been deleted'}

    async def change_password(
        self,
        user: UserComplete,
        form_data: PasswordChange,
    ) -> dict:
        PasswordService.check(form_data.old_password, user.password)
        pswd = PasswordService.generate(form_data.new_password)
        async with self.repository.uow:
            await self.repository.update({'password': pswd}, id=user.id)
        return {'status': 'Password has been changed'}

    async def delete_user(self, user_id: int, token: str) -> dict:
        await self.delete_inactive_user(user_id)
        await self.redis_repo.sadd('jwt_blacklist', token)
        return {'status': 'Deleted'}

    async def delete_inactive_user(self, user_id: int) -> None:
        async with self.repository.uow:
            await self.repository.delete(user_id)

    async def password_reset(self, form_data: PasswordReset) -> dict:
        email = form_data.email
        user = await self.repository.retrieve(email=email)
        response = {'status': 'Check your email for password reset link.'}
        token_data = {'user_id': user.id, 'email': form_data.email}
        return {'message': response, 'token': token_data} 

    async def password_reset_confirm(
        self,
        token: str,
        form_data: PasswordResetConfirm,
    ) -> dict:
        pswd1 = form_data.password1
        pswd2 = form_data.password2
        if pswd1 != pswd2:
            raise ValidationError('Passwords do not match')

        # decode token
        data = await self.token_service.decode(token)
        user_id = data['user_id']
        pswd = PasswordService.generate(pswd1)

        # try to update password
        async with self.repository.uow:
            await self.repository.update({'password': pswd}, id=user_id)
        return {'status': 'Password has been changed'}

    def send_confirmation_letter(self, data: dict) -> str:
        prepared = self.prepare_mail_data(data)
        return self.background_service.send_confirmation_letter(
            token_service=self.token_service,
            recipient=prepared['recipient'],
            token_data=prepared['token_data'],
        )

    def send_password_reset(self, data: dict) -> str:
        prepared = self.prepare_mail_data(data)
        return self.background_service.send_password_reset(
            token_service=self.token_service,
            recipient=prepared['recipient'],
            token_data=prepared['token_data'],
        )

    @staticmethod
    def prepare_mail_data(data: dict) -> dict:
        response = {
            'recipient': data['email'],
            'token_data': {
                'user_id': data['user_id'],
                'email': data['email'],
            },
        }
        return response


class CompanyUseCase:
    
    def __init__(self, repository: ICompanyRepository):
        self.repository = repository

    async def get_companies(self) -> list[CompanySchema]:
        companies = await self.repository.list()
        return [CompanySchema(**company.to_entity().to_dict()) for company in companies]

    async def get_company(self, name: str) -> CompanySchema:
        company = await self.repository.retrieve(name=name)
        return CompanySchema(**company.to_dict())

    async def get_company_offers(self, name: str) -> list[dict]:
        company = await self.repository.get_company_offers(name)
        offers = company.user.offers
        response_data = []
        for offer in offers:
            formatted = format_offer(offer, company.name)
            response_data.append(formatted)
        return response_data

    async def register_company(self, user_id: int, data: CompanyRegister) -> CompanySchema:
        input_data = data.model_dump()
        input_data['user_id'] = user_id

        if data.logo:
            image = {'path': 'media/companies/', 'image': data.logo}
            input_data['logo'] = await prepare_image_data(image)

        async with self.repository.uow:
            user = await self.repository.add(input_data)
        return CompanySchema(**user.to_dict())

    async def update_company(
        self,
        user_id: int,
        data: CompanyUpdate,
    ) -> CompanySchema:
        async with self.repository.uow:
            input_data = data.model_dump(exclude_unset=True)
            if data.logo:
                logo = data.logo
                path = 'media/users/' + logo.filename
                input_data['logo'] = await generate_image_path(
                    path=path,
                    image=logo,
                    content_type=logo.content_type,
                )
            company = await self.repository.get_user_company(user_id)
            response = await self.repository.update(input_data, id=company.id)
        return CompanySchema(**response.to_dict())

    async def delete_company(self, user_id: int) -> dict:
        async with self.repository.uow:
            await self.repository.delete(user_id)
        return {'status': 'Deleted'}


class UserSocialUseCase:

    def __init__(self, repository: IUserRepository, token_service: ITokenService):
        self.repository = repository
        self.token_service = token_service
        self.http_client = httpx.AsyncClient()

    @staticmethod
    def get_google_link(client_id: str, redirect_uri: str) -> dict:
        url = 'https://accounts.google.com/o/oauth2/auth'
        response_type = 'response_type=code'
        client_id = f'client_id={client_id}'
        redirect_uri = f'redirect_uri={redirect_uri}'
        scope = 'scope=openid%20profile%20email'
        access_type = 'access_type=offline'

        response = f'{url}?{response_type}&{client_id}&{redirect_uri}&{scope}&{access_type}'
        return {'url': response}

    async def google_authentication(
        self,
        code: str,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
    ) -> Token:
        token_url = 'https://accounts.google.com/o/oauth2/token'
        data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }

        response = await self.http_client.post(token_url, data=data)
        
        # get user info
        access_token = response.json().get('access_token')
        user_info_url = 'https://www.googleapis.com/oauth2/v1/userinfo'
        user_info_header = {'Authorization': f'Bearer {access_token}'}
        user_info = await self.http_client.get(user_info_url, headers=user_info_header)
        user_info_response = user_info.json()

        google_id = user_info_response.get('id')
        email = user_info_response.get('email')
        picture = user_info_response.get('picture')

        # check if user exists
        try:
            user = await self.repository.retrieve(email=email)
        except NotFoundError:
            return {
                'google_url': 'http://localhost:8000/auth/google-auth/register',
                'email': email,
                'google_id': google_id,
                'avatar': picture,
            }
        else:
            if user.provider != 'google':
                switch_to_google = {
                    'provider': 'google',
                    'social_id': google_id,
                }
                async with self.repository.uow:
                    await self.repository.update(switch_to_google, id=user.id)
            data = {'id': user.id, 'username': user.username}
            access_token = self.token_service.encode(data)
            refresh_token = self.token_service.encode(data, exp_time=1440)
            return Token(access_token=access_token, refresh_token=refresh_token)

    async def google_registration(self, data: UserSocialRegister) -> UserSchema:
        input_data = data.model_dump(exclude_unset=True)
        input_data['provider'] = 'google'
        input_data['is_active'] = True
        if data.avatar:
            avatar_url = data.avatar
            path = 'media/users/' + f'{input_data['username']}.png'
            avatar_data = await self.http_client.get(avatar_url)
            with open('src/' + path, 'wb') as f:
                f.write(avatar_data.content)
            input_data['avatar'] = path

        async with self.repository.uow:
            response = await self.repository.add(input_data)
        return UserSchema(**response.to_dict())
