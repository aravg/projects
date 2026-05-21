from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import auth, complaints, users, dashboard, categories, feedback, notifications
from .seed import seed_data

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CCRTS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(feedback.router)
app.include_router(notifications.router)

@app.on_event("startup")
async def startup():
    seed_data()

@app.get("/")
def root():
    return {"message": "CCRTS API is running", "version": "1.0.0"}
