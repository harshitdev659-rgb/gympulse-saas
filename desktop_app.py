import os
import sys
import time
import socket
import threading
import subprocess
import ctypes
import urllib.request
import urllib.error

# Explicitly set Application User Model ID so Windows Taskbar pins GymPulse branding (NOT Python logo)
try:
    APP_USER_MODEL_ID = "gympulse.saas.desktop.v1"
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_USER_MODEL_ID)
except Exception:
    pass

# Base and bundle directories (supporting both source and PyInstaller compiled executable)
if getattr(sys, 'frozen', False):
    EXE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = getattr(sys, '_MEIPASS', EXE_DIR)
    BASE_DIR = EXE_DIR
    BACKEND_DIR = os.path.join(BUNDLE_DIR, "backend")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR
    BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Ensure stdout/stderr don't crash when running under pythonw.exe (no console)
log_file = os.path.join(BASE_DIR, "desktop_app.log")
try:
    if sys.stdout is None:
        sys.stdout = open(log_file, "a", encoding="utf-8")
    if sys.stderr is None:
        sys.stderr = sys.stdout
except Exception:
    pass

HOST = "127.0.0.1"

def get_lan_ip() -> str:
    """Detect local Wi-Fi IP so phones and tablets on same network can connect."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"

LAN_IP = get_lan_ip()

ICON_PATH = os.path.join(BUNDLE_DIR, "gympulse.ico")
if not os.path.exists(ICON_PATH):
    ICON_PATH = os.path.join(BASE_DIR, "gympulse.ico")

PNG_PATH = os.path.join(BUNDLE_DIR, "gympulse.png")
if not os.path.exists(PNG_PATH):
    PNG_PATH = os.path.join(BASE_DIR, "gympulse.png")

SPLASH_SCRIPT = os.path.join(BUNDLE_DIR, "splash.py")
if not os.path.exists(SPLASH_SCRIPT):
    SPLASH_SCRIPT = os.path.join(BASE_DIR, "splash.py")

def is_port_in_use(port: int) -> bool:
    """Fast check whether a port is currently open."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.06)
            return s.connect_ex((HOST, port)) == 0
    except Exception:
        return False

def is_gympulse_healthy(port: int) -> bool:
    """Check if an active server is GymPulse returning 200 OK."""
    try:
        url = f"http://{HOST}:{port}/api/health"
        req = urllib.request.Request(url, headers={"User-Agent": "GymPulseDesktop/1.0"})
        with urllib.request.urlopen(req, timeout=0.6) as resp:
            return resp.status == 200
    except Exception:
        return False

def determine_app_port() -> int:
    """Picks port 8000 or next free port, reusing existing GymPulse if already running."""
    if is_gympulse_healthy(8000):
        return 8000
    if not is_port_in_use(8000):
        return 8000
    for p in range(8001, 8025):
        if is_gympulse_healthy(p):
            return p
        if not is_port_in_use(p):
            return p
    return 8000

PORT = determine_app_port()
APP_URL = f"http://{HOST}:{PORT}"

def wait_for_server(timeout: float = 15.0) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_gympulse_healthy(PORT) or is_port_in_use(PORT):
            return True
        time.sleep(0.08)
    return False

def start_backend_server():
    """Seeds DB if needed and starts uvicorn server in-process."""
    db_file = os.path.join(BASE_DIR, "gympulse.db")
    if not os.path.exists(db_file):
        try:
            from seed import seed_database
            seed_database(reset=True)
        except Exception as e:
            print(f"[GymPulse] Database seed notice: {e}", flush=True)

    print(f"[GymPulse] Local desktop access: http://127.0.0.1:{PORT}", flush=True)
    print(f"[GymPulse] Mobile Wi-Fi phone access: http://{LAN_IP}:{PORT}", flush=True)

    import uvicorn
    from app.main import app
    config = uvicorn.Config(
        app=app,
        host="0.0.0.0",  # Listen on all interfaces so mobile phones & tablets on Wi-Fi can connect
        port=PORT,
        log_level="warning",
        access_log=False
    )
    server = uvicorn.Server(config)
    server.run()

def apply_taskbar_icon():
    """Win32 thread to force the GymPulse icon onto the native window handle (removes Python taskbar icon)."""
    import webview
    WM_SETICON = 0x0080
    ICON_SMALL = 0
    ICON_BIG = 1
    IMAGE_ICON = 1
    LR_LOADFROMFILE = 0x00000010

    for _ in range(50):
        time.sleep(0.08)
        if webview.windows and hasattr(webview.windows[0], 'native') and webview.windows[0].native:
            try:
                form = webview.windows[0].native
                hwnd = int(form.Handle.ToInt64())
                if hwnd and os.path.exists(ICON_PATH):
                    hicon_big = ctypes.windll.user32.LoadImageW(None, ICON_PATH, IMAGE_ICON, 48, 48, LR_LOADFROMFILE)
                    hicon_small = ctypes.windll.user32.LoadImageW(None, ICON_PATH, IMAGE_ICON, 16, 16, LR_LOADFROMFILE)
                    if hicon_big:
                        ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, ICON_BIG, hicon_big)
                    if hicon_small:
                        ctypes.windll.user32.SendMessageW(hwnd, WM_SETICON, ICON_SMALL, hicon_small)
                    break
            except Exception:
                pass

def launch_standalone_app_window(url: str):
    """Fallback: Launches standalone Chromium/Edge App window (no URL bar, no tabs)."""
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    ]
    browser_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            browser_exe = p
            break

    if browser_exe:
        user_data_dir = os.path.join(BASE_DIR, ".desktop_profile")
        cmd = [
            browser_exe,
            f"--app={url}",
            f"--user-data-dir={user_data_dir}",
            "--window-size=1420,920",
            "--disable-features=TranslateUI",
            "--disable-sync",
            "--app-id=GymPulseSaaS"
        ]
        proc = subprocess.Popen(cmd)
        proc.wait()
    else:
        import webbrowser
        webbrowser.open(url)

def main():
    splash_proc = None
    # 1. Immediately launch native splash screen process to show the app's logo
    if os.path.exists(SPLASH_SCRIPT):
        try:
            python_exe = sys.executable
            if "python.exe" in python_exe.lower():
                pythonw_candidate = python_exe.lower().replace("python.exe", "pythonw.exe")
                if os.path.exists(pythonw_candidate):
                    python_exe = pythonw_candidate

            splash_proc = subprocess.Popen([python_exe, SPLASH_SCRIPT])
        except Exception as e:
            print(f"[GymPulse] Splash launch note: {e}", flush=True)

    # 2. Start backend server in a background thread if not already active
    if not is_gympulse_healthy(PORT):
        backend_thread = threading.Thread(target=start_backend_server, daemon=True)
        backend_thread.start()

    # 3. Wait for backend to be healthy
    wait_for_server(timeout=15.0)

    # Ensure splash screen displays for at least 650ms so user clearly sees the logo
    time.sleep(0.65)

    # 4. Terminate splash screen now that main window is ready
    if splash_proc:
        try:
            splash_proc.terminate()
        except Exception:
            pass

    # 5. Launch Standalone Desktop App Window (Primary: PyWebView)
    try:
        import webview
        storage_cache = os.path.join(BASE_DIR, ".desktop_cache")
        os.makedirs(storage_cache, exist_ok=True)

        window = webview.create_window(
            title="GymPulse SaaS - Gym Management System",
            url=APP_URL,
            width=1420,
            height=900,
            min_size=(1024, 720),
            resizable=True,
            text_select=True,
            zoomable=True
        )

        # Thread to set custom taskbar icon on the HWND to replace Python logo
        threading.Thread(target=apply_taskbar_icon, daemon=True).start()

        icon_arg = ICON_PATH if os.path.exists(ICON_PATH) else None
        if icon_arg:
            webview.start(icon=icon_arg, private_mode=False, storage_path=storage_cache)
        else:
            webview.start(private_mode=False, storage_path=storage_cache)
        
        sys.exit(0)
    except Exception as e:
        print(f"[GymPulse] PyWebView fallback to standalone app mode: {e}", flush=True)
        launch_standalone_app_window(APP_URL)
        sys.exit(0)

if __name__ == "__main__":
    main()
