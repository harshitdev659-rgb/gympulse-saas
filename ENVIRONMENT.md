# Environment Variables Reference

GymPulse SaaS is configured via standard environment variables or a `.env` file located in the project root or `backend/` directory.

---

## 1. Core Configuration Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | String | `GymPulse SaaS` | Name displayed across branding, emails, and page titles. |
| `APP_VERSION` | String | `1.0.0` | Application release version. |
| `ENVIRONMENT` | String | `development` | `development` or `production`. Controls error verbosity and docs. |
| `DEBUG` | Boolean | `false` | Enable detailed SQLAlchemy queries and debug logs. |

---

## 2. Security & Authentication

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `SECRET_KEY` | String | *Built-in fallback* | **CRITICAL**: High-entropy secret key used to sign JWT access tokens. Must be changed in production! |
| `ALGORITHM` | String | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Integer | `10080` (7 days) | Validity period for authentication tokens. |
| `ALLOWED_ORIGINS` | Comma-separated | `*` | Allowed CORS origins for browser API requests. |

---

## 3. Database

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | `sqlite:///./gympulse.db` | Connection string. Supports SQLite and PostgreSQL.<br>Example Postgres: `postgresql://user:pass@host:5432/dbname` |

---

## 4. AI Copilot Integration

GymPulse features a dual-mode AI engine. By default, it operates on a built-in deterministic analytics engine requiring zero external API keys.

| Variable | Options | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `local`, `openai`, `gemini`, `anthropic` | `local` | Active AI backend. |
| `OPENAI_API_KEY` | String | `""` | Optional OpenAI API secret key (if `AI_PROVIDER=openai`). |
| `GEMINI_API_KEY` | String | `""` | Optional Google Gemini API key (if `AI_PROVIDER=gemini`). |
| `ANTHROPIC_API_KEY` | String | `""` | Optional Anthropic Claude API key (if `AI_PROVIDER=anthropic`). |

---

## 5. SaaS Billing & Quotas

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `BILLING_ENABLED` | Boolean | `true` | Enables or disables SaaS tier limit checking. |
| `TIER_FREE_MAX_MEMBERS` | Integer | `25` | Maximum active members allowed on the Free tier. |
| `TIER_PRO_MAX_MEMBERS` | Integer | `250` | Maximum active members allowed on the Pro tier. |
| `TIER_BUSINESS_MAX_MEMBERS` | Integer | `100000` | Maximum active members allowed on the Business tier (unlimited). |
