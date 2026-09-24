import os
import sys
import io
import pytest
import datetime

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.models import Gym, User, MembershipPlan, Member, MemberMembership, Payment, Attendance

from sqlalchemy.pool import StaticPool

# Create in-memory SQLite database for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    # Create Gym A
    gym_a = Gym(
        name="Titan Gym",
        slug="titan-gym",
        email="contact@titangym.com",
        currency="INR",
        plan_tier="free",
        approval_status="approved",
        is_approved=True,
        payment_verified=True,
        max_members=2  # Low limit to test tier enforcement
    )
    db.add(gym_a)
    db.flush()

    user_a = User(
        gym_id=gym_a.id,
        full_name="Titan Owner",
        email="owner@titangym.com",
        password_hash=get_password_hash("Secret123!"),
        role="owner",
        is_active=True
    )
    # Super Admin User
    super_admin = User(
        gym_id=gym_a.id,
        full_name="Platform Admin",
        email="superadmin@gympulse.com",
        password_hash=get_password_hash("SuperAdmin123!"),
        role="superadmin",
        is_superadmin=True,
        is_active=True
    )
    db.add_all([user_a, super_admin])

    plan_a = MembershipPlan(
        gym_id=gym_a.id,
        name="Titan Monthly",
        duration_days=30,
        price=1499.0,
        billing_period="monthly",
        is_active=True
    )
    db.add(plan_a)
    db.flush()

    # Create Gym B (Tenant Isolation Target)
    gym_b = Gym(
        name="Spartan Fitness",
        slug="spartan-fitness",
        email="info@spartan.com",
        currency="INR",
        plan_tier="pro",
        approval_status="approved",
        is_approved=True,
        payment_verified=True,
        max_members=250
    )
    db.add(gym_b)
    db.flush()

    user_b = User(
        gym_id=gym_b.id,
        full_name="Spartan Admin",
        email="admin@spartan.com",
        password_hash=get_password_hash("Secret123!"),
        role="owner",
        is_active=True
    )
    db.add(user_b)


    # Member in Gym B
    member_b = Member(
        gym_id=gym_b.id,
        first_name="Leonidas",
        last_name="King",
        phone="+1-555-300-0000",
        status="active"
    )
    db.add(member_b)

    db.commit()
    yield
    Base.metadata.drop_all(bind=test_engine)

def get_auth_token(email: str = "owner@titangym.com", password: str = "Secret123!") -> str:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]

# ----------------- Tests -----------------

def test_login_success_and_failure():
    # Success
    res = client.post("/api/auth/login", json={"email": "owner@titangym.com", "password": "Secret123!"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "owner@titangym.com"
    assert data["gym"]["slug"] == "titan-gym"

    # Bad password
    res_bad = client.post("/api/auth/login", json={"email": "owner@titangym.com", "password": "WrongPassword!"})
    assert res_bad.status_code == 401

def test_multi_tenant_isolation():
    """Verify that User from Gym A can NEVER access Gym B's data."""
    token_a = get_auth_token("owner@titangym.com")
    token_b = get_auth_token("admin@spartan.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Gym B has member Leonidas
    res_b = client.get("/api/members", headers=headers_b)
    assert res_b.status_code == 200
    b_members = res_b.json()
    assert len(b_members) == 1
    spartan_member_id = b_members[0]["id"]
    assert b_members[0]["first_name"] == "Leonidas"

    # Gym A lists members: must NOT see Leonidas
    res_a = client.get("/api/members", headers=headers_a)
    assert res_a.status_code == 200
    assert len(res_a.json()) == 0

    # Gym A attempts to fetch Spartan member directly by ID: MUST return 404!
    res_a_leak = client.get(f"/api/members/{spartan_member_id}", headers=headers_a)
    assert res_a_leak.status_code == 404

    # Gym A attempts to delete Spartan member: MUST return 404!
    res_a_del = client.delete(f"/api/members/{spartan_member_id}", headers=headers_a)
    assert res_a_del.status_code == 404

def test_member_crud_and_tier_limits():
    token = get_auth_token("owner@titangym.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Add Member 1
    m1 = client.post("/api/members", headers=headers, json={
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1-555-111-2222",
        "email": "john.doe@example.com"
    })
    assert m1.status_code == 201
    m1_id = m1.json()["id"]

    # Add Member 2
    m2 = client.post("/api/members", headers=headers, json={
        "first_name": "Jane",
        "last_name": "Smith",
        "phone": "+1-555-333-4444"
    })
    assert m2.status_code == 201

    # Member 3: Should exceed max_members=2 for Titan Gym free tier!
    m3 = client.post("/api/members", headers=headers, json={
        "first_name": "Blocked",
        "last_name": "User",
        "phone": "+1-555-555-6666"
    })
    assert m3.status_code == 402  # Payment Required / Quota Exceeded

    # Upgrade tier to Pro requested (placed into pending state awaiting admin payment confirmation)
    upgrade_res = client.post("/api/billing/upgrade", headers=headers, json={"target_tier": "pro"})
    assert upgrade_res.status_code == 200
    assert upgrade_res.json()["upgrade_status"] == "pending"

    # Before Admin approval, member addition must still be blocked by tier limit!
    m3_blocked = client.post("/api/members", headers=headers, json={
        "first_name": "Blocked",
        "last_name": "User",
        "phone": "+1-555-555-6666"
    })
    assert m3_blocked.status_code == 402

    # Super Admin verifies payment and approves upgrade
    admin_token = get_auth_token("superadmin@gympulse.com", "SuperAdmin123!")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    db = TestingSessionLocal()
    titan_gym = db.query(Gym).filter(Gym.slug == "titan-gym").first()
    gym_id = titan_gym.id
    db.close()

    approve_res = client.post(f"/api/platform/gyms/{gym_id}/approve-upgrade", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["plan_tier"] == "pro"

    # Now Member 3 can be added!
    m3_retry = client.post("/api/members", headers=headers, json={
        "first_name": "Allowed",
        "last_name": "User",
        "phone": "+1-555-555-6666"
    })
    assert m3_retry.status_code == 201

def test_attendance_checkin_and_checkout():
    token = get_auth_token("owner@titangym.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create member
    m = client.post("/api/members", headers=headers, json={
        "first_name": "Clark",
        "last_name": "Kent",
        "phone": "+1-555-999-8888"
    }).json()

    # Check-in
    checkin_res = client.post("/api/attendance/check-in", headers=headers, json={
        "member_id": m["id"],
        "method": "manual"
    })
    assert checkin_res.status_code == 201
    att_id = checkin_res.json()["id"]

    # Double check-in without check-out should fail
    duplicate_res = client.post("/api/attendance/check-in", headers=headers, json={
        "member_id": m["id"]
    })
    assert duplicate_res.status_code == 400

    # Check-out
    checkout_res = client.post("/api/attendance/check-out", headers=headers, json={
        "attendance_id": att_id
    })
    assert checkout_res.status_code == 200
    assert checkout_res.json()["check_out_time"] is not None

def test_payment_and_receipt():
    token = get_auth_token("owner@titangym.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create member
    m = client.post("/api/members", headers=headers, json={
        "first_name": "Bruce",
        "last_name": "Wayne",
        "phone": "+1-555-000-1111"
    }).json()

    # Record payment
    pay_res = client.post("/api/payments", headers=headers, json={
        "member_id": m["id"],
        "amount": 150.0,
        "payment_method": "card",
        "notes": "Personal training block"
    })
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["amount"] == 150.0
    assert pay_data["invoice_number"].startswith("INV-")

    # Receipt HTML endpoint
    receipt_res = client.get(f"/api/payments/{pay_data['id']}/receipt", headers=headers)
    assert receipt_res.status_code == 200
    assert "Receipt #" in receipt_res.text
    assert "Bruce Wayne" in receipt_res.text
    assert "150.00" in receipt_res.text

def test_ai_assistant_tenant_isolation():
    token_a = get_auth_token("owner@titangym.com")
    token_b = get_auth_token("admin@spartan.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Gym A asks AI about members
    ai_a = client.post("/api/ai/query", headers=headers_a, json={"query": "how many total members do we have?"})
    assert ai_a.status_code == 200
    assert "Titan Gym currently has" in ai_a.json()["answer"]
    assert "Spartan" not in ai_a.json()["answer"]

    # Gym B asks AI about members
    ai_b = client.post("/api/ai/query", headers=headers_b, json={"query": "how many total members do we have?"})
    assert ai_b.status_code == 200
    assert "Spartan Fitness currently has" in ai_b.json()["answer"]
    assert "Titan" not in ai_b.json()["answer"]

def test_ai_speech_to_text_handling():
    token = get_auth_token("owner@titangym.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Test empty audio file
    empty_file = io.BytesIO(b"")
    res_empty = client.post(
        "/api/ai/speech-to-text",
        headers=headers,
        files={"audio": ("empty.wav", empty_file, "audio/wav")}
    )
    assert res_empty.status_code == 200
    data_empty = res_empty.json()
    assert data_empty["success"] is False
    assert "empty" in data_empty["message"].lower()

    # Test dummy non-speech bytes (graceful failure, no 500 exception)
    dummy_wav = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    res_dummy = client.post(
        "/api/ai/speech-to-text",
        headers=headers,
        files={"audio": ("test.wav", dummy_wav, "audio/wav")}
    )
    assert res_dummy.status_code == 200
    data_dummy = res_dummy.json()
    assert data_dummy["success"] is False

def test_platform_admin_approval_workflow():
    # 1. New gym registers -> status is pending
    reg_res = client.post("/api/auth/register-gym", json={
        "gym_name": "Phoenix Fitness Hub",
        "owner_name": "Phoenix Owner",
        "email": "owner@phoenixhub.com",
        "password": "Password123!",
        "currency": "INR"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["gym"]["approval_status"] == "pending"
    assert reg_data["gym"]["is_approved"] is False
    new_gym_id = reg_data["gym"]["id"]
    new_owner_token = reg_data["access_token"]
    owner_headers = {"Authorization": f"Bearer {new_owner_token}"}

    # 2. Attempt operational action while unapproved -> 403 Forbidden
    blocked_res = client.post("/api/members", headers=owner_headers, json={
        "first_name": "Applicant",
        "last_name": "Athlete",
        "phone": "+91 99999 88888"
    })
    assert blocked_res.status_code == 403
    assert "pending platform owner approval" in blocked_res.json()["detail"].lower()

    # 3. Owner submits payment reference (e.g. UTR / Cash voucher)
    pay_res = client.post("/api/auth/submit-payment", headers=owner_headers, json={
        "payment_ref": "UPI-REF-998877",
        "payment_method": "qr_code"
    })
    assert pay_res.status_code == 200
    assert pay_res.json()["registration_payment_ref"] == "UPI-REF-998877"

    # 4. Super Admin logs in and verifies payment and approves facility
    superadmin_token = get_auth_token("superadmin@gympulse.com", "SuperAdmin123!")
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}
    
    # Check metrics
    metrics_res = client.get("/api/platform/metrics", headers=admin_headers)
    assert metrics_res.status_code == 200
    assert metrics_res.json()["pending_approvals"] >= 1

    # Approve
    approve_res = client.post(f"/api/platform/gyms/{new_gym_id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "approved"
    assert approve_res.json()["is_approved"] is True

    # 4. Now gym owner can perform operational tasks!
    allowed_res = client.post("/api/members", headers=owner_headers, json={
        "first_name": "Applicant",
        "last_name": "Athlete",
        "phone": "+91 99999 88888"
    })
    assert allowed_res.status_code == 201

def test_public_website_and_inquiry():
    # 1. Fetch public website for Titan Gym (no auth required)
    pub_res = client.get("/api/public/facility/titan-gym")
    assert pub_res.status_code == 200
    pub_data = pub_res.json()
    assert pub_data["name"] == "Titan Gym"
    assert pub_data["currency"] == "INR"
    assert len(pub_data["plans"]) >= 1

    # 2. Prospective member submits online inquiry (no auth required)
    inq_res = client.post("/api/public/facility/titan-gym/inquire", json={
        "full_name": "Rajesh Kumar",
        "phone": "+91 98765 00000",
        "email": "rajesh@example.com",
        "plan_name": "Titan Monthly",
        "message": "I want to join starting next Monday."
    })
    assert inq_res.status_code == 200
    assert inq_res.json()["success"] is True

    # 3. Gym owner views the lead in their inquiries portal
    owner_token = get_auth_token("owner@titangym.com")
    headers = {"Authorization": f"Bearer {owner_token}"}
    leads_res = client.get("/api/gym/inquiries", headers=headers)
    assert leads_res.status_code == 200
    leads = leads_res.json()
    assert len(leads) >= 1
    assert leads[0]["full_name"] == "Rajesh Kumar"

def test_user_re_registration_and_login():
    # Register first gym
    r1 = client.post("/api/auth/register-gym", json={
        "gym_name": "First Studio",
        "owner_name": "Multi Owner",
        "email": "multi@fitness.com",
        "password": "PasswordOne1!",
        "currency": "INR"
    })
    assert r1.status_code == 200

    # Register second gym with SAME email and NEW password
    r2 = client.post("/api/auth/register-gym", json={
        "gym_name": "Second Studio",
        "owner_name": "Multi Owner",
        "email": "multi@fitness.com",
        "password": "PasswordTwo2!",
        "currency": "INR"
    })
    assert r2.status_code == 200

    # Now login with the new password -> must authenticate successfully!
    login_res = client.post("/api/auth/login", json={
        "email": "multi@fitness.com",
        "password": "PasswordTwo2!"
    })
    assert login_res.status_code == 200
    assert login_res.json()["access_token"] is not None
    assert login_res.json()["user"]["email"] == "multi@fitness.com"

def test_owner_gym_decommission_and_website_deletion():
    # 1. Register a test facility: Iron Vault Gym
    reg_res = client.post("/api/auth/register-gym", json={
        "gym_name": "Iron Vault Gym",
        "owner_name": "Vault Owner",
        "email": "vault_owner@ironvault.com",
        "password": "VaultPassword123!",
        "currency": "INR"
    })
    assert reg_res.status_code == 200
    owner_token = reg_res.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    gym_slug = reg_res.json()["gym"]["slug"]

    # 2. Verify dedicated HTTPS public website is live
    site_res = client.get(f"/api/public/facility/{gym_slug}")
    assert site_res.status_code == 200
    assert site_res.json()["name"] == "Iron Vault Gym"

    # 3. Security Check: Deletion attempt with incorrect password must fail with 401
    bad_pw_res = client.request("DELETE", "/api/gym/decommission", headers=owner_headers, json={
        "password": "WrongPassword999!",
        "confirm_gym_name": "Iron Vault Gym"
    })
    assert bad_pw_res.status_code == 401
    assert "incorrect password" in bad_pw_res.json()["detail"].lower()

    # 4. Security Check: Deletion attempt with mismatched name must fail with 400
    bad_name_res = client.request("DELETE", "/api/gym/decommission", headers=owner_headers, json={
        "password": "VaultPassword123!",
        "confirm_gym_name": "Different Gym Name"
    })
    assert bad_name_res.status_code == 400
    assert "mismatch" in bad_name_res.json()["detail"].lower()

    # 5. Legitimate Decommission with correct re-auth
    del_res = client.request("DELETE", "/api/gym/decommission", headers=owner_headers, json={
        "password": "VaultPassword123!",
        "confirm_gym_name": "Iron Vault Gym"
    })
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 6. Verify HTTPS public website is now GONE (404 Not Found)
    site_after = client.get(f"/api/public/facility/{gym_slug}")
    assert site_after.status_code == 404
    assert "not found" in site_after.json()["detail"].lower() or "deleted" in site_after.json()["detail"].lower()

    # 7. Verify athlete inquiry submission to deleted site fails with 404
    inq_after = client.post(f"/api/public/facility/{gym_slug}/inquire", json={
        "full_name": "Lost Athlete",
        "phone": "+91 99999 00000"
    })
    assert inq_after.status_code == 404

    # 8. Verify owner account was purged (subsequent login fails with 401)
    login_after = client.post("/api/auth/login", json={
        "email": "vault_owner@ironvault.com",
        "password": "VaultPassword123!"
    })
    assert login_after.status_code == 401

def test_superadmin_gym_deletion():
    # 1. Register a test facility: Silver Fitness
    reg_res = client.post("/api/auth/register-gym", json={
        "gym_name": "Silver Fitness",
        "owner_name": "Silver Owner",
        "email": "owner@silverfit.com",
        "password": "SilverPass123!",
        "currency": "INR"
    })
    assert reg_res.status_code == 200
    gym_id = reg_res.json()["gym"]["id"]
    gym_slug = reg_res.json()["gym"]["slug"]

    # Verify site is up
    assert client.get(f"/api/public/facility/{gym_slug}").status_code == 200

    # 2. Super Admin deletes gym via /api/platform/gyms/{id}
    superadmin_token = get_auth_token("superadmin@gympulse.com", "SuperAdmin123!")
    admin_headers = {"Authorization": f"Bearer {superadmin_token}"}

    del_res = client.delete(f"/api/platform/gyms/{gym_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 3. Public website immediately returns 404 Not Found
    assert client.get(f"/api/public/facility/{gym_slug}").status_code == 404

def test_security_headers_and_timing_safety():
    # 1. Verify AppSec security headers on HTTP responses
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "SAMEORIGIN"
    assert "1; mode=block" in resp.headers.get("X-XSS-Protection", "")

    # 2. Verify non-existent login returns 401 cleanly with timing defense
    fake_login = client.post("/api/auth/login", json={
        "email": "nonexistent_hacker@darkweb.org",
        "password": "SomeAttackString123!"
    })
    assert fake_login.status_code == 401
    assert "incorrect email or password" in fake_login.json()["detail"].lower()


def test_windows_portable_download_endpoint():
    # 1. Windows download endpoint
    win_res = client.get("/api/download/windows")
    assert win_res.status_code == 200
    assert "application/zip" in win_res.headers.get("content-type", "")
    assert "GymPulse_Windows_Portable.zip" in win_res.headers.get("content-disposition", "")

    # 2. Network info endpoint returns 24/7 cloud_url and download URLs
    net_res = client.get("/api/settings/network-info")
    assert net_res.status_code == 200
    data = net_res.json()
    assert data["download_url"] == "/api/download/windows"
    assert "8000" in data["local_url"]
    assert "cloud_url" in data
    assert "public_url" in data
    assert data["cloud_url"].startswith("http")

    # 3. Test updating cloud_url via API
    update_res = client.post("/api/settings/cloud-url", json={
        "cloud_url": "https://gympulse-saas.onrender.com"
    })
    assert update_res.status_code == 200
    assert update_res.json()["cloud_url"] == "https://gympulse-saas.onrender.com"


