
# 📑 Compliance Demo 2.0.1 – Full-Stack KYC & Sanctions Screening App

**Compliance Demo 2.0.1** is a reference implementation demonstrating a modern **Know Your Customer (KYC)** and **sanctions screening** solution. It integrates:

- **React (Create React App)** for the frontend  
- **FastAPI** for the backend API  
- **PostgreSQL** with SQLAlchemy for data persistence  
- **EasyOCR** for document text extraction (OCR)  
- A free **local LLM (Ollama/Mistral)** for AI-driven interpretation  
- **ReportLab** for high-quality PDF report generation  

Ideal for fintech teams, compliance engineers, and developers building AML/KYC workflows.

---

## 🔍 Table of Contents

1. [Project Overview](#project-overview)  
2. [Core Benefits & Features](#core-benefits--features)  
3. [Tech Stack & Architecture](#tech-stack--architecture)  
4. [Getting Started – Quick Setup](#getting-started--quick-setup)  
5. [Download Sanctions Dataset (Important)](#download-sanctions-dataset-important)  
6. [API Reference](#api-reference)  
7. [Database & Migrations (Alembic)](#database--migrations-alembic)  
8. [Testing & Quality Assurance](#testing--quality-assurance)  
9. [Troubleshooting & Known Issues](#troubleshooting--known-issues)  
10. [Detailed Architecture & Dependency Maps](#detailed-architecture--dependency-maps)  
11. [Contact & Collaboration](#contact--collaboration)  
12. [Commercial Use & Partnerships](#commercial-use--partnerships)  
13. [Credits & License](#credits--license)  

---

## 🎯 Project Overview

**Compliance Demo 2.0.1** covers:

- **KYC Onboarding & Registration**: Multi-step forms, document uploads, and PDF export.  
- **Sanctions Screening**: Fuzzy and phonetic matching against an OFAC-style dataset (OpenSanctions).  
- **OCR Extraction & AI Interpretation**: EasyOCR for raw text from ID documents, then local LLM (Ollama/Mistral) for structured fields.  
- **PRADO Integration**: Automatic link generation to the EU PRADO identity-document database.  
- **Audit Logging**: Persist searches and registrations in PostgreSQL.  
- **PDF Report Generation**: Compile KYC data, screenshots, and uploaded documents with ReportLab.

---

## ⭐ Core Benefits & Features

- **Open-Source KYC Software**: Build a robust **AML/KYC workflow** quickly with no licensing fees.  
- **Free Local LLM Assistant**: Automate identity extraction and verification with **OCR** and a free **Ollama** model.  
- **Real-Time Sanctions Screening**: Reduce risk by screening against watchlists using **phonetic matching** and **fuzzy logic**.  
- **Seamless PDF Generation**: Produce audit-ready, branded PDFs combining KYC data and uploaded documents.  
- **Easy Integration**: Modular **REST API** layer makes it simple to embed into existing platforms or fintech applications.  
- **EU PRADO Lookup**: Quickly generate PRADO links for official identity-document specifications.

---

## 🏗️ Tech Stack & Architecture

### Frontend (React + Create React App)
- **React 18** with **functional components** and **hooks**  
- **Create React App (CRA)** powered by `react-scripts` for development, testing, and production builds  
- **CSS Modules** (optional) or plain CSS for component-level styling  
- **Axios** (or Fetch API) for HTTP requests to the backend  
- **jspdf** and **html2canvas** for PDF generation and screenshots  

### Backend (FastAPI + PostgreSQL + SQLAlchemy + Ollama)
- **FastAPI** for high-performance RESTful API endpoints  
- **SQLAlchemy** ORM for data modeling and **Alembic** for database migrations  
- **PostgreSQL** (v13+) for reliable, ACID-compliant storage  
- **EasyOCR** for document text extraction (OCR)  
- **Ollama (local LLM)** for AI-based interpretation without cost  
- **ReportLab** for generating PDF reports  
- **rapidfuzz** and **textdistance** for fuzzy string matching  

### Folder Structure

```plaintext
frontend/
└── src/
    ├── components/common/     # Reusable Button, Input components
    ├── context/               # React Context for application phase
    ├── features/
    │   ├── sanctions/         # Sanctions search UI & hooks
    │   ├── registration/      # KYC form, uploader, PDF generator
    │   ├── ocr/               # OCR controls, panel, AI chat
    │   ├── ai/                # Local LLM chat interface & hooks
    │   └── prado/             # PRADO URL helper
    ├── hooks/                 # Custom React hooks (localStorage, screenshots)
    ├── services/              # Generic API and domain services
    ├── utils/                 # Data URL ↔ Blob conversion
    ├── styles/                # global & CSS variable files
    ├── App.js                 # Main routing by app phase
    └── index.js               # ReactDOM entrypoint

backend/
├── alembic.ini               # Alembic configuration for migrations
├── config.py                 # Database URL builder from environment vars
├── create_tables.py          # One-time table creation script
├── database.py               # SQLAlchemy engine & session factory
├── db_models.py              # ORM models: CustomerRegistration, LogEntry
├── migrations/               # Alembic revision history
│   ├── env.py
│   └── versions/
│       └── 3526e89c8cb2_create_customer_registrations_table.py
├── main.py                   # FastAPI entrypoint, CORS, router
├── routes.py                 # All REST endpoints wiring to handlers
├── audit_log.py              # Logging search & registration events
├── data_ingestion.py         # Sanctions dataset loader & normalizer
├── matching.py               # Fuzzy & phonetic matching algorithms
├── ocr_handler.py            # EasyOCR document processing functions
├── ai_agent.py               # Ollama LLM wrapper for AI interpretation & chat
├── prado.py                  # PRADO URL generation & parsing utilities
├── pdf_doc_handler.py        # Insert images/draw content into PDF pages
├── pdfBuilder.py             # Compose final compliance PDF report
├── screenshot.py             # Decode screenshot data URLs for PDF
├── phonetic_cache.py         # Cache Soundex keys for faster matching
├── utils.py                  # Generic helpers for image/data processing
├── models.py                 # Pydantic schemas for request/response validation
└── requirements.txt          # Pin Python dependencies for reproducibility


## 🚀 Getting Started – Quick Setup

### 1. Clone & Install
```bash
git clone https://github.com/serdarcekinmez/compliance-sanctions-app.git
cd compliance-sanctions-app
2. Environment Variables
Create a .env file or export environment variables:

bash
Copy
Edit
# PostgreSQL connection (adjust values accordingly)
export POSTGRES_HOST=localhost
export POSTGRES_DB=kyc_demo
export POSTGRES_USER=kyc_user
export POSTGRES_PASSWORD=kyc_pass

# Ollama LLM (free local model)
export OLLAMA_BASE_URL="http://localhost:11434"
3. Start PostgreSQL
Ensure a PostgreSQL (v13+) instance is running and reachable:

bash
Copy
Edit
docker run -d \
  --name kyc-postgres \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -p 5432:5432 \
  postgres:13
4. Backend Setup
bash
Copy
Edit
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start backend using Python (due to EasyOCR dependencies)
python main.py
Note:
You may normally use uvicorn main:app --reload, but EasyOCR can conflict with Uvicorn. Using python main.py ensures smoother startup.

API docs available at http://localhost:8000/docs

Health check at http://localhost:8000

5. Frontend Setup (Create React App)
bash
Copy
Edit
cd ../frontend
npm install
npm start
Frontend runs at http://localhost:3000.

CRA’s Webpack Dev Server will proxy API calls to http://localhost:8000 if you set "proxy": "http://localhost:8000" in frontend/package.json.

🌐 Download Sanctions Dataset (Important for First Run)
bash
Copy
Edit
# Download OpenSanctions dataset (~500MB)
wget -O backend/Open_sanctions_target_nested_json_dataset \
  https://data.opensanctions.org/datasets/latest/default/targets.nested.json
Place the downloaded file in backend/ before launching the server so that /verify_identity searches use local data.

📋 API Reference
🔹 Sanctions Screening & Identity Verification
POST /verify_identity

Request Body:

jsonc
Copy
Edit
{
  "full_name": "John Doe",
  "date_of_birth": "1980-01-01"
}
Response: List of sanctions matches with fuzzy and phonetic scores.

Use Case: Validate if a customer appears on any watchlist.

🔹 KYC Registration & Document Handling
POST /save_registration

Request Body:

jsonc
Copy
Edit
{
  "customer_data": { /* fields from RegistrationForm */ },
  "uploaded_documents": [ /* base64 URLs or form-data */ ]
}
Response:

json
Copy
Edit
{
  "status": "success",
  "registration_id": 1234
}
Use Case: Store KYC form data, link uploaded docs, generate a database record.

POST /generate_pdf

Request Body:

jsonc
Copy
Edit
{
  "registration_id": 1234,
  "screenshots": [ /* data URL strings for form sections */ ]
}
Response: 200 OK with PDF binary (application/pdf).

Use Case: Produce a downloadable, audit-ready PDF combining KYC data, screenshots, and uploaded documents.

🔹 OCR & AI-Powered Interpretation
POST /extract_identity_info

Request Body:

jsonc
Copy
Edit
{ "file": <multipart-file> }
Response:

json
Copy
Edit
{
  "extracted_text": "Full OCR text from document image"
}
Use Case: Raw OCR text extraction (no AI inference).

POST /ocr_and_interpret

Request Body:

jsonc
Copy
Edit
{ "file": <multipart-file> }
Response:

json
Copy
Edit
{
  "structured_identity": {
    "full_name": "John Doe",
    "date_of_birth": "1980-01-01"
    /* additional fields */
  }
}
Use Case: Run OCR then a free local LLM (Ollama/Mistral) to return structured JSON fields (name, DOB, address).

POST /chat_with_ai

Request Body:

jsonc
Copy
Edit
{
  "message": "Where can I find PRADO details for Italian passport?"
}
Response:

json
Copy
Edit
{
  "reply": "You can check the PRADO page at https:// ... based on context ..."
}
Use Case: Free local LLM-powered conversational assistant for compliance practitioners and KYC agents.

🔹 PRADO Integration
POST /prepare_prado_url

Request Body:

jsonc
Copy
Edit
{ "country_code": "IT", "document_type": "PASSPORT" }
Response:

json
Copy
Edit
{
  "prado_url": "https://prado.europa.eu/..."
}
Use Case: Quickly build a link to the official EU PRADO portal for a given country/document type combination.

🗃️ Database & Alembic Migrations
Define / Modify Models
Edit backend/db_models.py with new columns or tables.

Autogenerate Revision

bash
Copy
Edit
cd backend
alembic revision --autogenerate -m "Add email column to CustomerRegistration"
Review Migration Script
Located in backend/migrations/versions/XXXX_create_customer_registrations_table.py. Ensure upgrade() and downgrade() reflect intended changes.

Apply Migration

bash
Copy
Edit
alembic upgrade head
(Optional) Create Tables Manually

bash
Copy
Edit
python create_tables.py
🧪 Testing & Quality Assurance
Backend Tests (pytest)
bash
Copy
Edit
cd backend
pytest -q --disable-warnings --maxfail=1
Unit tests cover API endpoints, OCR logic, matching algorithms, and PDF generation.

Aim for coverage ≥ 80%.

Frontend Tests (Jest & React Testing Library)
bash
Copy
Edit
cd frontend
npm test
Component tests verify form validation, API service calls, and state management.

Snapshot tests for key React components.

⚠️ Troubleshooting & Known Issues
OCR & Backend Startup
EasyOCR may conflict with Uvicorn. Use:

bash
Copy
Edit
python main.py
instead of uvicorn main:app --reload.

System Dependencies:

bash
Copy
Edit
sudo apt-get update && sudo apt-get install -y libgl1-mesa-glx libglib2.0-0
OCR Alternative Recommendation
For higher accuracy, you can try PaddleOCR:

bash
Copy
Edit
pip install paddlepaddle paddleocr
Note: Can introduce pandas/compatibility issues.

Database Connection Issues
Verify PostgreSQL container is running:

bash
Copy
Edit
docker ps | grep kyc-postgres
Ensure .env matches your container credentials exactly.

CORS / Frontend Proxy
Ensure "proxy": "http://localhost:8000" is set in frontend/package.json.

Restart frontend after any changes:

bash
Copy
Edit
npm start
Port Conflicts
Adjust backend port if 8000 is in use:

bash
Copy
Edit
uvicorn main:app --reload --port 8001
Update "proxy" in frontend/package.json accordingly.

📚 Detailed Architecture & Dependency Maps
Frontend Dependency Map: docs/frontendRolesTable.xlsx

Backend Dependency Map: docs/backend_inventory_final.xlsx

Project Directory Tree (PDF): docs/project_tree.pdf

Download or preview these for a deeper understanding of module relationships, import chains, and file roles.

📞 Contact & Collaboration
Interested in this project or compliance technology?

Email: serdar.cekinmez@gmail.com

GitHub: github.com/serdarcekinmez

LinkedIn: linkedin.com/in/serdarcekinmez

🤝 Commercial Use & Partnerships
For commercial licensing or enterprise features, please contact via email.

❤️ Credits & License
License: MIT

Acknowledgments:

Built with ❤️ using FastAPI, React, and ReportLab.

OCR powered by EasyOCR.

Free local LLM assistance via Ollama.

Special thanks to the OpenSanctions team for providing comprehensive sanctions datasets that enable this demo’s screening capabilities.
