from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "StudyMind API"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated frontend origins.",
    )
    supabase_url: str | None = None
    supabase_api_key: str | None = None
    supabase_anon_key: str | None = None
    next_public_supabase_url: str | None = None
    next_public_supabase_publishable_key: str | None = None
    supabase_enabled: bool = True
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    redis_url: str | None = None

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def use_supabase(self) -> bool:
        return bool(self.supabase_enabled and self.supabase_project_url and self.supabase_key)

    @property
    def supabase_key(self) -> str | None:
        return self.supabase_api_key or self.next_public_supabase_publishable_key or self.supabase_anon_key

    @property
    def supabase_project_url(self) -> str | None:
        return self.supabase_url or self.next_public_supabase_url


settings = Settings()
