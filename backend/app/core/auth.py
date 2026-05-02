from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import Depends, Header, HTTPException, status

from app.core.config import settings
from app.schemas.study import AuthUser


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


def verify_supabase_token(token: str) -> AuthUser:
    if not settings.use_supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Auth is not configured.",
        )

    response = httpx.get(
        f"{settings.supabase_project_url}/auth/v1/user",
        headers={
            "apikey": settings.supabase_key or "",
            "Authorization": f"Bearer {token}",
        },
        timeout=10,
    )
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase access token.",
        )

    data = response.json()
    return AuthUser(
        id=data["id"],
        email=data.get("email"),
        role=data.get("role"),
        is_demo=False,
    )


def get_optional_user(authorization: Annotated[str | None, Header()] = None) -> AuthUser | None:
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    return verify_supabase_token(token)


def get_current_user(user: Annotated[AuthUser | None, Depends(get_optional_user)]) -> AuthUser:
    if user:
        return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Login required. Send Authorization: Bearer <supabase_access_token>.",
    )


def resolve_user_id(request_user_id: str | None, user: AuthUser | None) -> str:
    if user:
        if request_user_id and request_user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Request user_id does not match the logged-in user.",
            )
        return user.id
    if request_user_id:
        return request_user_id
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Provide user_id for demo mode or log in with Supabase Auth.",
    )
