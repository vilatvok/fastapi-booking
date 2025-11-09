import logging
import contextlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi_pagination import add_pagination
from sqladmin import Admin
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from src.application.exceptions import (
    InvalidDataError,
    NotFoundError,
    RepositoryError,
    AlreadyExistsError,
    ValidationError,
)
from src.infrastructure.database import session_manager
from src.presentation.api.dependencies.scheduler import scheduler
from src.presentation.api.admin import (
    ChatAdmin,
    UserAdmin,
    CompanyAdmin,
    OfferAdmin,
    FeedbackAdmin,
    ImageAdmin,
    PriceAdmin,
    MessageAdmin,
)
from src.presentation.api.routers.offers import router as offer_router
from src.presentation.api.routers.users import router as user_router
from src.presentation.api.routers.companies import router as company_router
from src.presentation.api.routers.auth import router as auth_router
from src.presentation.api.routers.chats import router as chat_router
from src.presentation.api.rate_limiter import limiter
from src.presentation.api import exceptions


logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.DEBUG)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.shutdown()
    if session_manager._engine is not None:
        await session_manager.close()


app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(NotFoundError, exceptions.not_found_error_handler)
app.add_exception_handler(InvalidDataError, exceptions.invalid_data_error_handler)
app.add_exception_handler(RepositoryError, exceptions.repository_error_handler)
app.add_exception_handler(AlreadyExistsError, exceptions.already_exists_error_handler)
app.add_exception_handler(ValidationError, exceptions.validation_error_handler)
app.add_exception_handler(PermissionError, exceptions.permission_error_handler)

add_pagination(app)


# add cors for react app
origins = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# mount static and media files
app.mount('/static', StaticFiles(directory='src/static'), name='static')
app.mount('/media', StaticFiles(directory='src/media'), name='media')


# add routes
app.include_router(offer_router, tags=['offers'], prefix='/offers')
app.include_router(user_router, tags=['users'], prefix='/users')
app.include_router(auth_router, tags=['auth'], prefix='/auth')
app.include_router(chat_router, tags=['chats'], prefix='/chats')
app.include_router(
    company_router,
    tags=['companies'],
    prefix='/companies',
)


# admin site
admin = Admin(app, session_manager._engine)
admin.add_view(UserAdmin)
admin.add_view(CompanyAdmin)
admin.add_view(OfferAdmin)
admin.add_view(FeedbackAdmin)
admin.add_view(ImageAdmin)
admin.add_view(PriceAdmin)
admin.add_view(ChatAdmin)
admin.add_view(MessageAdmin)
