# Development & Local Setup Guide

This guide walks through configuring and running **GymPulse SaaS** locally from scratch.

---

## 1. Prerequisites

- **Python**: Version 3.10 or newer (tested on Python 3.13)
- **Node.js**: Version 18 or newer (tested on Node 20 / 24)
- **Git** (optional)

---

## 2. Fast Setup (Windows Virtual Environment)

If the virtual environment is already prepared:
```cmd
# 1. Activate environment
.\venv\Scripts\activate

# 2. Seed database with realistic demo gyms
python backend\seed.py

# 3. Launch application
python run.py
```
Your browser will open automatically at **`http://localhost:8000`**.

---

## 3. Fresh Installation from Scratch

### Step A: Clone / Navigate
```bash
cd "Gym management"
```

### Step B: Setup Python Backend
```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat
# On Linux / macOS:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt
```

### Step C: Setup Frontend & Build
```bash
cd frontend
npm install
npm run build
cd ..
```
*Note: `npm run build` outputs the production static bundle directly into `backend/static/`, allowing FastAPI to serve the entire full-stack app on a single port.*

### Step D: Seed Initial Database
```bash
python backend/seed.py
```

### Step E: Run Application
```bash
python run.py
```

---

## 4. Running in Separate Development Mode (Hot Reload)

If you want live Hot Module Reloading (HMR) for frontend development:

**Terminal 1 (Backend API):**
```bash
cd "Gym management"
$env:PYTHONPATH = "backend"
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

**Terminal 2 (Frontend Vite Server):**
```bash
cd "Gym management\frontend"
npm run dev
```
Open **`http://localhost:5173`**. Requests to `/api` are automatically proxied to the FastAPI server on port 8000.

---

## 5. Resetting Database
To reset the database to fresh realistic sample data at any time:
```bash
python backend\seed.py --reset
```
