from src.application.interfaces.repositories.users import IUserRepository
from src.application.interfaces.repositories.chats import IChatRepository


class ConnectionManager:

    def __init__(
        self,
        chat_repo: IChatRepository,
        user_repo: IUserRepository,
    ):
        self.active_connections: dict[int, list] = {}
        self.chat_repo = chat_repo
        self.user_repo = user_repo

    async def connect(self, websocket, chat_id: int):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        
        self.active_connections[chat_id].append(websocket)
        print(self.active_connections)

    def disconnect(self, websocket, chat_id: int):
        self.active_connections[chat_id].remove(websocket)
        print(self.active_connections)

    async def send_message(self, data: dict):
        content = data['content']
        chat_id = data['chat_id']
        sender_id = data['sender']['id']

        async with self.chat_repo.uow:
            msg = await self.save_to_db(chat_id, sender_id, content)

            data['id'] = msg.id
            data['timestamp'] = msg.timestamp.strftime("%Y-%m-%d %H:%M:%S")

            for connection in self.active_connections[chat_id]:
                await connection.send_json(data)

    async def receive_message(self, websocket) -> dict:
        return await websocket.receive_json()

    async def save_to_db(self, chat_id: int, sender_id: int, content: str):
        data = {'chat_id': chat_id, 'sender_id': sender_id, 'content': content}
        return await self.chat_repo.add_message(data)
