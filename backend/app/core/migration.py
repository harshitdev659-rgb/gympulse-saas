"""
Database Schema Migration Manager for GymPulse.
Performs safe, non-destructive, idempotent column additions for SQLite and SQL databases.
"""
import logging
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger("gympulse.migration")

def run_db_migrations(engine: Engine) -> list:
    """
    Safely inspects existing tables and applies missing column migrations.
    Idempotent: Running multiple times will never duplicate or error on existing columns.
    Non-destructive: Never drops tables or columns.
    """
    applied = []
    try:
        with engine.connect() as conn:
            # Check if gyms table exists
            table_check = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='gyms';")
            ).fetchall() if engine.url.drivername.startswith("sqlite") else [(1,)]
            
            if table_check:
                res = conn.execute(text("PRAGMA table_info('gyms');")).fetchall()
                gym_cols = {r[1]: r for r in res}
                
                gym_migrations = [
                    ("registration_payment_method", "ALTER TABLE gyms ADD COLUMN registration_payment_method VARCHAR(50) DEFAULT 'qr_code';"),
                    ("registration_payment_ref", "ALTER TABLE gyms ADD COLUMN registration_payment_ref VARCHAR(100);"),
                    ("requested_plan_tier", "ALTER TABLE gyms ADD COLUMN requested_plan_tier VARCHAR(50);"),
                    ("tier_upgrade_status", "ALTER TABLE gyms ADD COLUMN tier_upgrade_status VARCHAR(50) DEFAULT 'none';"),
                    ("tier_upgrade_requested_at", "ALTER TABLE gyms ADD COLUMN tier_upgrade_requested_at DATETIME;"),
                    ("website_theme", "ALTER TABLE gyms ADD COLUMN website_theme VARCHAR(50) DEFAULT 'dark_power';"),
                    ("website_primary_color", "ALTER TABLE gyms ADD COLUMN website_primary_color VARCHAR(50) DEFAULT '#10b981';"),
                    ("website_hero_style", "ALTER TABLE gyms ADD COLUMN website_hero_style VARCHAR(50) DEFAULT 'split';"),
                    ("website_announcement", "ALTER TABLE gyms ADD COLUMN website_announcement VARCHAR(255);"),
                ]
                
                for col_name, stmt in gym_migrations:
                    if col_name not in gym_cols:
                        conn.execute(text(stmt))
                        applied.append(f"gyms.{col_name}")
                        logger.info(f"[Migration] Added missing column gyms.{col_name}")
            
            # Check users table
            table_check = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
            ).fetchall() if engine.url.drivername.startswith("sqlite") else [(1,)]
            
            if table_check:
                res = conn.execute(text("PRAGMA table_info('users');")).fetchall()
                user_cols = {r[1]: r for r in res}
                
                user_migrations = [
                    ("permissions", "ALTER TABLE users ADD COLUMN permissions TEXT;"),
                ]
                
                for col_name, stmt in user_migrations:
                    if col_name not in user_cols:
                        conn.execute(text(stmt))
                        applied.append(f"users.{col_name}")
                        logger.info(f"[Migration] Added missing column users.{col_name}")
            
            conn.commit()
            if applied:
                logger.info(f"[Migration] Schema migration completed successfully: {applied}")
            else:
                logger.info("[Migration] Database schema is fully up-to-date. No migrations required.")
            return applied
    except Exception as e:
        logger.error(f"[Migration] Fatal error during database schema migration: {e}", exc_info=True)
        raise RuntimeError(f"Database migration failed: {e}") from e

if __name__ == "__main__":
    from app.core.database import engine
    print("Running migrations directly on current engine...")
    cols = run_db_migrations(engine)
    print("Migrations applied:", cols)
