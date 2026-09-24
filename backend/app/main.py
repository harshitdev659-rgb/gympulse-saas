import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    auth, dashboard, members, plans, memberships,
    attendance, payments, trainers, reports, ai, settings as settings_api, billing,
    platform, public_website
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database has tables and default seed data on first run."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(gyms);")).fetchall()
            col_names = [r[1] for r in res]
            if "registration_payment_method" not in col_names:
                conn.execute(text("ALTER TABLE gyms ADD COLUMN registration_payment_method VARCHAR(50) DEFAULT 'qr_code';"))
            if "registration_payment_ref" not in col_names:
                conn.execute(text("ALTER TABLE gyms ADD COLUMN registration_payment_ref VARCHAR(100);"))
            conn.commit()
    except Exception as e:
        pass

    try:
        from app.models.models import User
        from app.core.database import SessionLocal
        db = SessionLocal()
        user_count = db.query(User).count()
        db.close()
        if user_count == 0:
            print("[GymPulse] Fresh database detected. Seeding initial tenants and accounts...", flush=True)
            try:
                from seed import seed_database
                seed_database(reset=False)
            except ImportError:
                from backend.seed import seed_database
                seed_database(reset=False)
            print("[GymPulse] Database successfully initialized.", flush=True)
    except Exception as e:
        print(f"[GymPulse] Startup init notice: {e}", flush=True)
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AppSec Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "microphone=*, camera=()"
    return response

# Mount API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(members.router, prefix="/api")
app.include_router(plans.router, prefix="/api")
app.include_router(memberships.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(trainers.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(platform.router, prefix="/api")
app.include_router(public_website.router, prefix="/api")


# Static uploads directory
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }

@app.api_route("/api/download/windows", methods=["GET", "HEAD"])
def download_windows_app():
    """Direct download for standalone Windows application (zero Python required)."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    zip_path = os.path.join(base_dir, "GymPulse_Windows_Portable.zip")
    if not os.path.exists(zip_path):
        zip_path = os.path.join(os.path.dirname(__file__), "..", "GymPulse_Windows_Portable.zip")
    if os.path.exists(zip_path):
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename="GymPulse_Windows_Portable.zip"
        )
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url="https://github.com/harshitdev659-rgb/gympulse-saas/releases/download/v1.0.0/GymPulse_Windows_Portable.zip",
        status_code=302
    )


# Check for production frontend build in static/ or ../frontend/dist
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "static")
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str, request: Request):
        # Don't intercept API or docs routes
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json"]:
            return HTMLResponse(status_code=404, content="Not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def index():
        return {
            "message": f"Welcome to {settings.APP_NAME} API!",
            "docs": "/docs",
            "status": "operational",
            "note": "Frontend is building or running separately via Vite on port 5173"
        }
