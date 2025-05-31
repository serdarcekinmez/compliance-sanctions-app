
```markdown
# 📑 Compliance Demo 2.0.1 – Full-Stack KYC & Sanctions Screening App

> **Compliance Demo 2.0.1** is a reference implementation of a modern, **end-to-end KYC (Know Your Customer)** and **sanctions screening** solution. It leverages **React**, **FastAPI**, **PostgreSQL**, **OCR (Optical Character Recognition)**, a free **local LLM (Ollama)**, and **PDF generation** to deliver a robust compliance workflow. This open-source project is perfect for financial institutions, fintech startups, or anyone building **AML (Anti-Money Laundering)** and **KYC** capabilities.

---

## 🔍 Table of Contents

1. [Project Overview](#project-overview)  
2. [Core Benefits & Features](#core-benefits--features)  
3. [Tech Stack & Architecture](#tech-stack--architecture)  
4. [Getting Started – Quick Setup](#getting-started--quick-setup)  
5. [API Reference](#api-reference)  
6. [Database & Migrations (Alembic)](#database--migrations-alembic)  
7. [Testing & Quality Assurance](#testing--quality-assurance)  
8. [Contributing & Roadmap](#contributing--roadmap)  
9. [License & Credits](#license--credits)  

---

## 🎯 Project Overview

**Compliance Demo 2.0.1** is a comprehensive demonstration of:

- **KYC Onboarding & Registration**: Capture user information through multi-section forms, upload identity documents, and generate a compliance PDF.  
- **Sanctions Screening**: Fuzzy and phonetic matching against an OFAC-style dataset to verify identities in real time.  
- **OCR Extraction & LLM Interpretation**: Extract text from uploaded documents using **EasyOCR** and refine results via a free **Ollama** local model for structured identity fields.  
- **PRADO Reference Integration**: Dynamically generate links to the EU PRADO identity-document database for additional verification.  
- **Audit Logging**: Persist every search and registration event to PostgreSQL for full audit trails.  
- **PDF Report Generation**: Compile KYC data, screenshots, and uploaded documents into a downloadable, branded **ReportLab** PDF.

This repository serves as a learning resource for developers, compliance engineers, and security teams looking to integrate advanced identity verification, sanctions screening, and documentation workflows into their own applications.

---

## ⭐ Core Benefits & Features

- **Open-Source KYC Software**: Build a robust **AML/​KYC workflow** quickly with no licensing fees.  
- **Free Local LLM Assistant**: Automate identity extraction and verification with **OCR** and a free **Ollama** model, free of charge.  
- **Real-Time Sanctions Screening**: Reduce risk by screening against watchlists using **phonetic matching** and **fuzzy logic**.  
- **Seamless PDF Generation**: Produce audit-ready, branded PDFs combining KYC data and uploaded documents using **ReportLab**.  
- **Easy Integration**: Modular **REST API** layer makes it simple to embed into existing platforms or fintech applications.  
- **EU PRADO Lookup**: Quickly generate PRADO links for official identity-document specifications.

These built-in capabilities ensure a fully automated compliance pipeline that is both **scalable** and **maintainable**.  

---

## 🏗️ Tech Stack & Architecture

### Frontend (React + Vite)
- **React 18** with **functional components** and **hooks**  
- **Vite** for fast development and build  
- **CSS Modules** for isolated, maintainable styling  
- **Axios** (or Fetch) for API calls to backend

### Backend (FastAPI + PostgreSQL + SQLAlchemy + Ollama)
- **FastAPI** for high-performance RESTful API endpoints  
- **SQLAlchemy** ORM for data modeling and **Alembic** for database migrations  
- **PostgreSQL** (v13+) for reliable, ACID-compliant storage  
- **EasyOCR** for document text extraction  
- **Ollama (local LLM)** for AI-based interpretation without cost  
- **ReportLab** for generating PDF reports  
- **textdistance** and **rapidfuzz** for fuzzy string matching

### Folder Structure

```

frontend/
└── src/
├── components/common/     # Reusable Button, Input components
├── context/               # React Context for application phase
├── features/
│   ├── sanctions/         # Sanctions search UI & hooks
│   ├── registration/      # KYC form, uploader, PDF generator
│   ├── ocr/               # OCR controls, panel, LLM chat
│   ├── ai/                # Local LLM chat interface & hooks
│   └── prado/             # PRADO URL helper
├── hooks/                 # Custom React hooks (localStorage, screenshots)
├── services/              # Generic API and domain services
├── utils/                 # Data URL ↔ Blob conversion
├── styles/                # Global & CSS variable files
├── App.js                 # Main routing by app phase
└── index.js               # ReactDOM entrypoint

backend/
├── alembic.ini               # Alembic configuration for migrations
├── config.py                 # Database URL builder from environment vars
├── create\_tables.py          # One-time table creation script
├── database.py               # SQLAlchemy engine & session factory
├── db\_models.py              # ORM models: CustomerRegistration, LogEntry
├── migrations/               # Alembic revision history
│   ├── env.py
│   └── versions/
│       └── 3526e89c8cb2\_create\_customer\_registrations\_table.py
├── main.py                   # FastAPI entrypoint, CORS, router
├── routes.py                 # All REST endpoints wiring to handlers
├── audit\_log.py              # Logging search & registration events
├── data\_ingestion.py         # Sanctions dataset loader & normalizer
├── matching.py               # Fuzzy & phonetic matching algorithms
├── ocr\_handler.py            # EasyOCR document processing functions
├── ai\_agent.py               # Ollama LLM wrapper for AI interpretation & chat
├── prado.py                  # PRADO URL generation & parsing utilities
├── pdf\_doc\_handler.py        # Insert images/draw content into PDF pages
├── pdfBuilder.py             # Compose final compliance PDF report
├── screenshot.py             # Decode screenshot data URLs for PDF
├── phonetic\_cache.py         # Cache Soundex keys for faster matching
├── utils.py                  # Generic helpers for image/data processing
├── models.py                 # Pydantic schemas for request/response validation
└── requirements.txt          # Pin Python dependencies for reproducibility

````

> **Ignore in Git**: `venv/`, every `__pycache__/`, and IDE folders — already in `.gitignore`.

---

## 🚀 Getting Started – Quick Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-org/compliance-demo.git
cd compliance-demo
````

### 2. Environment Variables

Create a `.env` file or export environment variables:

```bash
# PostgreSQL connection (adjust values accordingly)
export POSTGRES_HOST=localhost
export POSTGRES_DB=kyc_demo
export POSTGRES_USER=kyc_user
export POSTGRES_PASSWORD=kyc_pass

# Ollama LLM (free local model)
export OLLAMA_BASE_URL="http://localhost:11434"

# (Optional) Other env vars:
# EMAIL_SENDER, PDF_TEMPLATE_PATH, LOG_LEVEL, etc.
```

### 3. Start PostgreSQL

Ensure a **PostgreSQL** (v13+) instance is running and reachable:

```bash
docker run -d \
  --name kyc-postgres \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -p 5432:5432 \
  postgres:13
```

### 4. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4a. Run Alembic migrations (preferred)
alembic upgrade head

# OR 4b. Create tables manually (if not using Alembic)
python create_tables.py

# 4c. Launch FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

* **API docs** available at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI).
* **Health check** at [http://localhost:8000](http://localhost:8000).

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The React Vite app runs at [http://localhost:5173](http://localhost:5173). It automatically proxies API calls to `http://localhost:8000`.

---

## 📋 API Reference

### 🔹 **Sanctions Screening & Identity Verification**

* **`POST /verify_identity`**

  * **Request Body**:

    ```jsonc
    {
      "full_name": "John Doe",
      "date_of_birth": "1980-01-01"
    }
    ```
  * **Response**: List of sanctions matches with *fuzzy* and *phonetic* scores.
  * **Use Case**: Validate if a customer appears on any watchlist.

### 🔹 **KYC Registration & Document Handling**

* **`POST /save_registration`**

  * **Request Body**:

    ```jsonc
    {
      "customer_data": { /* fields from RegistrationForm */ },
      "uploaded_documents": [ /* base64 URLs or form-data */ ]
    }
    ```
  * **Response**:

    ```json
    {
      "status": "success",
      "registration_id": 1234
    }
    ```
  * **Use Case**: Store KYC form data, link uploaded docs, generate a database record.

* **`POST /generate_pdf`**

  * **Request Body**:

    ```jsonc
    {
      "registration_id": 1234,
      "screenshots": [ /* data URL strings for form sections */ ]
    }
    ```
  * **Response**:

    * **200 OK** with PDF binary (application/pdf).
  * **Use Case**: Produce a downloadable, audit-ready PDF combining KYC data, screenshots, and uploaded documents.

### 🔹 **OCR & LLM-Powered Interpretation**

* **`POST /extract_identity_info`**

  * **Request Body**:

    ```jsonc
    { "file": <multipart-file> }
    ```
  * **Response**:

    ```json
    {
      "extracted_text": "Full OCR text from document image"
    }
    ```
  * **Use Case**: Raw OCR text extraction (no AI inference).

* **`POST /ocr_and_interpret`**

  * **Request Body**:

    ```jsonc
    { "file": <multipart-file> }
    ```
  * **Response**:

    ```json
    {
      "structured_identity": {
        "full_name": "John Doe",
        "date_of_birth": "1980-01-01"
        /* additional fields */
      }
    }
    ```
  * **Use Case**: Run OCR then a free **local LLM (Ollama)** to return structured JSON fields (name, DOB, address).

* **`POST /chat_with_ai`**

  * **Request Body**:

    ```jsonc
    {
      "message": "Where can I find PRADO details for Italian passport?"
    }
    ```
  * **Response**:

    ```json
    {
      "reply": "You can check the PRADO page at https:// ... based on context ..."
    }
    ```
  * **Use Case**: Free local LLM-powered conversational assistant for compliance practitioners and KYC agents.

### 🔹 **PRADO Integration**

* **`POST /prepare_prado_url`**

  * **Request Body**:

    ```jsonc
    { "country_code": "IT", "document_type": "PASSPORT" }
    ```
  * **Response**:

    ```json
    {
      "prado_url": "https://prado.europa.eu/..."
    }
    ```
  * **Use Case**: Quickly build a link to the official EU PRADO portal for a given country/document type combination.

---

## 🗃️ Database & Alembic Migrations

1. **Define / Modify Models**
   Edit `backend/db_models.py` with new columns or tables.

2. **Autogenerate Revision**

   ```bash
   cd backend
   alembic revision --autogenerate -m "Add email column to CustomerRegistration"
   ```

3. **Review Migration Script**
   Located in `backend/migrations/versions/XXXX_create_customer_registrations_table.py`. Ensure `upgrade()` and `downgrade()` reflect intended changes.

4. **Apply Migration**

   ```bash
   alembic upgrade head
   ```

5. **(Optional) Create Tables Manually**

   ```bash
   python create_tables.py
   ```

---

## 🧪 Testing & Quality Assurance

### Backend Tests (pytest)

```bash
cd backend
pytest -q --disable-warnings --maxfail=1
```

* **Unit tests** cover API endpoints, OCR logic, matching algorithms, and PDF generation.
* Ensure coverage ≥ 80%.

### Frontend Tests (Jest & React Testing Library)

```bash
cd frontend
npm test
```

* **Component tests** verify form validation, API service calls, and state management.
* **Snapshot tests** for key React components.

---

## ⚠️ Known Issues & Troubleshooting

### EasyOCR Dependency Conflicts

If you encounter dependency issues or import errors with EasyOCR, use the direct Python execution method instead of uvicorn:

```bash
# ❌ If this fails due to EasyOCR dependencies:
uvicorn main:app --reload

# ✅ Use this instead:
python main.py
```

### Common EasyOCR Issues:
- **CUDA/GPU conflicts** with FastAPI's uvicorn server
- **OpenCV library loading** issues in some environments
- **Import order conflicts** with computer vision dependencies

### Alternative Startup Methods:

```bash
# Method 1: Direct Python (Recommended for EasyOCR)
cd backend
python main.py

# Method 2: Uvicorn (if no dependency issues)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Method 3: Uvicorn with specific settings (alternative)
uvicorn main:app --reload --workers 1
```

### OCR Alternative Recommendation

**For developers experiencing persistent EasyOCR issues**: Consider **PaddleOCR** as an alternative - it often provides more accurate results for document processing. We didn't use it due to pandas version conflicts, but it may work better in your environment:

```bash
pip install paddlepaddle paddleocr
```

### Verification:
- Backend should be accessible at: `http://localhost:8000`
- API docs available at: `http://localhost:8000/docs`



## 🌱 Contributing & Roadmap

We welcome **community contributions**! Please follow these steps:

1. **Fork** the repository and **create a new branch**:

   ```bash
   git checkout -b feat/add-email-validation
   ```

2. **Lint and Format** your code:

   ```bash
   # Backend – use Black, Ruff
   black backend/ && ruff backend/

   # Frontend – use ESLint, Prettier (if configured)
   npm run lint
   ```

3. **Run Tests** locally before pushing:

   ```bash
   # Backend
   cd backend && pytest
   # Frontend
   cd frontend && npm test
   ```

4. **Open a Pull Request** against `main`. CI will run tests and ensure code quality.

### Roadmap / Upcoming Features

* **Multi-factor authentication** (SMS/Email OTP) during registration
* **Batch sanctions screening** for large customer uploads (CSV/Excel)
* **Webhook notifications** on suspicious identity matches
* **Docker Compose** improvements for local dev and end-to-end testing
* **RBAC (Role-Based Access Control)** integration for admin vs. agent roles

---

## 📄 License & Credits

**License**: [MIT License](LICENSE)

**Acknowledgments**:

* Built with ❤️ using [FastAPI](https://fastapi.tiangolo.com/), [React](https://reactjs.org/), and [ReportLab](https://www.reportlab.com/).
* OCR powered by [EasyOCR](https://github.com/JaidedAI/EasyOCR).
* Free local LLM assistance via [Ollama](https://ollama.com/).

---

> By using this open-source **Compliance Demo 2.0.1** as a reference, you can accelerate your **KYC/AML** implementation, reduce **compliance risk**, and deliver a seamless, automated identity verification workflow.

---
## 📚 Detailed Architecture & Dependency Maps

We maintain full dependency spreadsheets and a directory‐tree diagram in the **docs/** folder:

- **Frontend Dependency Map**: [docs/frontend_inventory.xlsx](docs/frontend_inventory.xlsx)  
- **Backend Dependency Map**: [docs/backend_inventory.xlsx](docs/backend_inventory.xlsx)  


Feel free to download or preview these to get a deeper understanding of module relationships, import chains, and file roles.
---
