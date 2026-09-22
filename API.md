# REST API Documentation

GymPulse SaaS provides an auto-documenting OpenAPI specification. When running the server, visit:
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Interactive Specs**: `http://localhost:8000/redoc`

All endpoints under `/api` (except public routes, registration/login, and health checks) require a Bearer token:
```
Authorization: Bearer <jwt-access-token>
```

---

## 1. Authentication (`/api/auth`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register-gym` | Register new gym facility and initial owner account (enters pending approval) | No |
| `POST` | `/api/auth/login` | Authenticate email and password; returns JWT token & user profile | No |
| `GET` | `/api/auth/me` | Fetch active user profile, permissions, and tenant metadata | Yes |
| `POST` | `/api/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/auth/reset-password` | Set new password with security token | No |
| `GET` | `/api/auth/users` | List all staff & trainer users in the current gym | Yes (Owner/Admin) |
| `POST` | `/api/auth/users` | Create staff or trainer login account | Yes (Owner/Admin) |
| `PUT` | `/api/auth/users/{id}` | Update staff user details, role, or active status | Yes (Owner/Admin) |

---

## 2. Platform Super Admin (`/api/platform`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/platform/gyms` | List all registered gyms, approval status, member counts, and tier | Yes (Super Admin) |
| `POST` | `/api/platform/gyms/{gym_id}/approve` | Approve a pending gym facility to start operations | Yes (Super Admin) |
| `POST` | `/api/platform/gyms/{gym_id}/suspend` | Suspend or reactivate a gym facility's access | Yes (Super Admin) |
| `DELETE` | `/api/platform/gyms/{gym_id}` | Permanently delete a gym facility and cascade-purge its public website | Yes (Super Admin) |

---

## 3. Dedicated Public Facility Websites & Leads (`/api/public`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/public/facility/{slug}` | Fetch approved public gym details, brand info, and available membership plans | No |
| `POST` | `/api/public/facility/{slug}/inquire` | Submit athlete trial request or membership inquiry (rate-limited) | No |

---

## 4. Facility Decommissioning (`/api/gym`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `DELETE` | `/api/gym/decommission` | High-assurance cascade decommissioning of the gym facility and instant deletion of its public website | Yes (Gym Owner) |

*Requires JSON payload containing `confirm_name` (must match exact gym name) and `owner_password` (verified with constant-time bcrypt).*

---

## 5. Direct Standalone App Downloads (`/api/download`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/download/windows` | Direct download of `GymPulse_Windows_Portable.zip` (standalone embedded runtime, no Python required) | No |

---

## 6. Dashboard (`/api/dashboard`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Aggregated real-time KPIs, active on-floor roster count, and charts data | Yes |

---

## 7. Members (`/api/members`)

| Method | Path | Query Parameters | Summary | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/members` | `search`, `status_filter`, `expiring_soon`, `trainer_id`, `skip`, `limit` | List gym members with search & filters | Yes |
| `POST` | `/api/members` | - | Create member (enforces SaaS tier quotas) | Yes |
| `GET` | `/api/members/{id}` | - | Detailed profile with membership, visit & payment history | Yes |
| `PUT` | `/api/members/{id}` | - | Update member profile details | Yes |
| `DELETE` | `/api/members/{id}` | - | Delete member and cascade related records | Yes |

---

## 8. Membership Plans & Subscriptions (`/api/plans`, `/api/memberships`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/plans` | List customizable membership plans (in INR ₹) | Yes |
| `POST` | `/api/plans` | Create a new membership plan | Yes (Owner/Admin) |
| `PUT` | `/api/plans/{id}` | Update membership plan details | Yes (Owner/Admin) |
| `DELETE` | `/api/plans/{id}` | Deactivate or delete plan | Yes (Owner/Admin) |
| `POST` | `/api/memberships/assign/{member_id}` | Assign or renew plan with auto-calculated expiry | Yes |
| `PATCH` | `/api/memberships/{id}/cancel` | Cancel an active membership | Yes |

---

## 9. Attendance & Check-In (`/api/attendance`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/attendance/today` | Today's active check-in roster and duration status | Yes |
| `POST` | `/api/attendance/check-in` | Check in a member (prevents duplicate open visits) | Yes |
| `POST` | `/api/attendance/check-out` | Mark check-out time for a visit record | Yes |
| `GET` | `/api/attendance/history` | Historical attendance log with date range filters | Yes |

---

## 10. Payments & Invoicing (`/api/payments`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/payments` | List transactions with status and date filters (in INR ₹) | Yes |
| `POST` | `/api/payments` | Record payment transaction (cash, card, UPI, bank transfer) | Yes |
| `GET` | `/api/payments/{id}/receipt` | Printable branded HTML invoice receipt | Yes |

---

## 11. Trainers (`/api/trainers`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/trainers` | List all gym trainers with client count | Yes |
| `POST` | `/api/trainers` | Register a new trainer | Yes (Owner/Admin) |
| `GET` | `/api/trainers/{id}/members` | View athletes assigned to this trainer | Yes |
| `PUT` | `/api/trainers/{id}` | Update trainer profile and session rate | Yes (Owner/Admin) |

---

## 12. Reports & CSV Exports (`/api/reports`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/summary` | Analytical summary figures for reports dashboard | Yes |
| `GET` | `/api/reports/revenue` | Detailed revenue report by payment method | Yes |
| `GET` | `/api/reports/revenue/export` | Download revenue ledger as CSV | Yes |
| `GET` | `/api/reports/members/export` | Download member directory as CSV | Yes |
| `GET` | `/api/reports/attendance/export` | Download attendance logs as CSV | Yes |

---

## 13. AI Assistant (`/api/ai`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/query` | Natural language operational query strictly scoped to authenticated gym | Yes |

---

## 14. Settings & SaaS Billing (`/api/settings`, `/api/billing`)

| Method | Path | Summary | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings/gym` | Get gym profile, logo, default currency (INR ₹) | Yes |
| `PUT` | `/api/settings/gym` | Update gym profile | Yes (Owner/Admin) |
| `GET` | `/api/settings/config` | Get operational hours, tax %, expiry window | Yes |
| `PUT` | `/api/settings/config` | Update operational configurations | Yes (Owner/Admin) |
| `GET` | `/api/billing/status` | Current SaaS plan tier, member quota, feature flags | Yes |
| `POST` | `/api/billing/upgrade` | Simulate tier upgrade (Free / Pro / Business) | Yes (Owner) |
