from typing import TYPE_CHECKING
from datetime import datetime
from sqlalchemy import ForeignKey, text
from sqlalchemy.orm import relationship, Mapped, mapped_column

from src.domain.entities import users as entities
from src.infrastructure.models.base import Base


# * import models only in case type checking
# * example: Mapped[list['Feedback']]
if TYPE_CHECKING:
    from src.infrastructure.models.offers import Feedback, Offer
    from src.infrastructure.models.chats import Chat, Message


class User(Base):
    __tablename__ = 'users'

    # Columns
    username: Mapped[str] = mapped_column(unique=True)
    email: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str | None]
    is_active: Mapped[bool] = mapped_column(default=False)
    is_company: Mapped[bool] = mapped_column(default=False)
    avatar: Mapped[str] = mapped_column(server_default='static/img/user_logo.png')

    # ! Should be extracted to separate table in case with many social providers
    social_id: Mapped[str | None] = mapped_column(unique=True)
    provider: Mapped[str] = mapped_column(default='local')

    # Relationships
    company: Mapped['Company'] = relationship(
        back_populates='user',
        cascade='all, delete-orphan',
    )
    offers: Mapped[list['Offer']] = relationship(
        back_populates='owner',
        cascade='all, delete-orphan',
    )
    chats: Mapped[list['Chat']] = relationship(
        primaryjoin=(
            "or_(Chat.first_user_id == User.id, Chat.second_user_id == User.id)"
        ),
    )
    messages: Mapped[list['Message']] = relationship(
        back_populates='sender',
    )
    feedbacks: Mapped[list['Feedback']] = relationship(
        back_populates='user',
        cascade='all, delete-orphan',
    )

    def to_entity(self):
        return entities.User(
            id=self.id,
            username=self.username,
            password=self.password,
            avatar=self.avatar,
            email=self.email,
            is_active=self.is_active,
            is_company=self.is_company,
            social_id=self.social_id,
            provider=self.provider,
        )


class Company(Base):
    __tablename__ = 'company'

    # Columns
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'),
    )
    user: Mapped['User'] = relationship(back_populates='company')
    owner: Mapped[str]
    email: Mapped[str]
    name: Mapped[str] = mapped_column(unique=True)
    logo: Mapped[str] = mapped_column(
        server_default='static/img/company_logo.png'
    )
    created_at: Mapped[datetime] = mapped_column(
        server_default=text("TIMEZONE('utc', now())")
    )

    def to_entity(self):
        return entities.Company(
            id=self.id,
            user_id=self.user_id,
            owner=self.owner,
            email=self.email,
            name=self.name,
            logo=self.logo,
            created_at=self.created_at,
        )
