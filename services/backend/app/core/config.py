from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TPMR API"
    ENV: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h pour l'app chauffeur
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = "postgresql://tpmr:tpmr_dev@localhost:5432/tpmr_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    # "localhost" et "127.0.0.1" sont deux origines DIFFÉRENTES pour le
    # navigateur, même si elles pointent vers la même machine — d'où l'ajout
    # explicite des deux variantes. Si votre dashboard tourne sur un autre
    # port (Next.js bascule sur 3001 si 3000 est occupé), ajoutez-le ici ou
    # dans CORS_ORIGINS de votre .env (format JSON : '["http://localhost:3001"]').
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()