from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.auth import router as auth_router
from backend.routes.projects import router as projects_router
from backend.routes.scraping import router as scraping_router
from backend.routes.payments import router as payments_router
from backend.scraper_algos import scrape
from pydantic import BaseModel

app = FastAPI(
    title="DMify API",
    description="Instagram DM Generator with User Management",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dmify.app",
        "https://www.dmify.app", 
        "https://dmify-app.onrender.com",  # Current backend domain
        "http://localhost:5173",  # For development
        "http://localhost:3000"   # For development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(scraping_router)
app.include_router(payments_router)

class ScrapeRequest(BaseModel):
    username: str
    product_info: str
    offer_info: str
    name: str

@app.get("/")
def read_root():
    return {"message": "DMify is live!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "dmify-api"}
