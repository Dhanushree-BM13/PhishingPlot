from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

import httpx
from fastapi import HTTPException


class SupabaseRest:
    def __init__(self, access_token: str):
        self.url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.anon_key = os.environ.get("SUPABASE_ANON_KEY", "")
        if not self.url or not self.anon_key:
            raise HTTPException(
                status_code=503,
                detail="Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
            )
        self.headers = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def request(
        self,
        method: str,
        table: str,
        *,
        params: dict[str, str] | None = None,
        payload: dict[str, Any] | list[dict[str, Any]] | None = None,
        prefer: str = "return=representation",
    ) -> Any:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.request(
                    method,
                    f"{self.url}/rest/v1/{quote(table)}",
                    headers={**self.headers, "Prefer": prefer},
                    params=params,
                    json=payload,
                )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail="Could not reach Supabase.") from exc

        if response.is_error:
            detail = "Supabase request failed."
            try:
                detail = response.json().get("message", detail)
            except ValueError:
                pass
            raise HTTPException(status_code=response.status_code, detail=detail)
        if response.status_code == 204 or not response.content:
            return []
        return response.json()
