




import os
import urllib.parse

# Database configuration with placeholder values
POSTGRES_USER = os.getenv("POSTGRES_USER", "your_postgres_username")

# Get password from environment or prompt user
raw_password = os.getenv("POSTGRES_PASSWORD")
if raw_password is None:
    raw_password = input("Enter your PostgreSQL password (leave blank for default): ")
    if raw_password == "":
        raw_password = "your_postgres_password"  # Replace with your actual password

# URL encode the password to safely handle special characters
POSTGRES_PASSWORD = urllib.parse.quote_plus(raw_password)
POSTGRES_DB = os.getenv("POSTGRES_DB", "compliance_logs")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")  # Standard PostgreSQL port

DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)