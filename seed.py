import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from seed import seed_database

if __name__ == "__main__":
    reset = "--no-reset" not in sys.argv
    seed_database(reset=reset)
