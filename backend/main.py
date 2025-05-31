



import os
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router  # We'll create routes.py in the next step

# Setup logging for operational quality
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ComplianceService")

# Create the FastAPI app
app = FastAPI(
    title="Financial Compliance Sanction Verification Service",
    description="API for customer verification and compliance management",
    version="1.0.0"
    )

# Enable CORS to allow your React app to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production for security (specify domains)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router from routes.py
app.include_router(router)

if __name__ == "__main__":
    # Launch the server
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
