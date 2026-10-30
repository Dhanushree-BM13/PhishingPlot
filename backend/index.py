"""Vercel entrypoint: deploy the backend/ folder as its own Vercel project."""

from app.main import app

__all__ = ["app"]
