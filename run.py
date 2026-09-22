import os
import sys

# Redirect to standalone desktop app window launcher or background server
if __name__ == "__main__":
    if "--server" in sys.argv or "--server-only" in sys.argv or "-s" in sys.argv:
        import desktop_app
        desktop_app.start_backend_server()
    else:
        import desktop_app
        desktop_app.main()
