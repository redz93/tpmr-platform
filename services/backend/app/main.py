from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 — enregistre tous les modèles avant toute requête
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.websocket_manager import start_redis_listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Diagnostic rapide au démarrage : si le dashboard n'arrive pas à se
    # connecter, la première chose à vérifier est que son origine (celle
    # affichée dans la barre d'adresse du navigateur) apparaît bien ici.
    print(f"[TPMR] Origines CORS autorisées : {settings.CORS_ORIGINS}")
    print(
    f"[TPMR] Redis configuré : "
    f"{settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL}"
)

    listener_task = start_redis_listener()
    yield
    listener_task.cancel()


app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}