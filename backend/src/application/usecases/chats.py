from src.application.dtos.users import UserSchema
from src.application.dtos.chats import ChatSchema, MessageSchema
from src.application.utils.chats import ConnectionManager
from src.application.interfaces.services.tokens import ITokenService
from src.application.interfaces.repositories.users import IUserRepository
from src.application.interfaces.repositories.chats import IChatRepository


class ChatUseCase:

    def __init__(
        self,
        chat_repo: IChatRepository,
        user_repo: IUserRepository,
        token_service: ITokenService,
    ):
        self.chat_repo = chat_repo
        self.user_repo = user_repo
        self.token_service = token_service

    async def create_chat(
        self,
        first_user_id: int,
        second_user_id: int,
    ) -> ChatSchema:
        data = {'first_user_id': first_user_id, 'second_user_id': second_user_id}
        async with self.chat_repo.uow:
            chat = await self.chat_repo.add(data)
        return ChatSchema(**chat.to_dict())

    async def get_chats(self, user_id: int) -> list[ChatSchema]:
        chats = await self.chat_repo.get_chats(user_id)
        return [ChatSchema(**chat.to_entity().to_dict()) for chat in chats]

    async def get_chat(self, user_id: int, chat_id: int) -> ChatSchema:
        chat = await self.chat_repo.retrieve(chat_id=chat_id, user_id=user_id)
        return ChatSchema(**chat.to_dict())

    async def get_chat_id(self, first_user_id: int, second_user_id: int) -> int:
        chat_id = await self.chat_repo.get_chat_id(first_user_id, second_user_id)
        return chat_id

    async def get_chat_messages(self, chat_id: int) -> list[MessageSchema]:
        messages = await self.chat_repo.get_chat_messages(chat_id)
        response = []
        for msg in messages:
            msg_data = msg.__dict__
            msg_data['sender'] = UserSchema(**msg_data['sender'].to_entity().to_dict())
            response.append(MessageSchema(**msg_data))
        return response

    async def get_sender(self, token: str) -> int:
        token_data = await self.token_service.decode(token)
        user_id = token_data.get('id')
        sender = await self.user_repo.retrieve(id=user_id)
        return UserSchema(**sender.to_dict())

    async def clear_chat(self, chat_id: int):
        async with self.chat_repo.uow:
            await self.chat_repo.clear_chat(chat_id)

    def get_connection_manager(self) -> ConnectionManager:
        return ConnectionManager(self.chat_repo, self.user_repo)
