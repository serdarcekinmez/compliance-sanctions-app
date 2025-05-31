

# routes.py

import os
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Query, Depends, HTTPException, Request, File, Form, UploadFile, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import tempfile
import shutil
import base64


from data_ingestion import load_dataset
from matching import match_record
from models import VerifyIdentityResponse, MatchResult
from audit_log import log_search
from database import get_db
from db_models import LogEntry, CustomerRegistration
# from screenshot_bySelenium import take_screenshot
from pdfBuilder import generate_pdf_report

# Import our new modules for OCR, AI, and PRADO

import ocr_handler
from ocr_handler import extract_identity_info
from ai_agent import AIAgent
from prado import parse_prado_query, get_prado_url

# Set up logging
logger = logging.getLogger("ComplianceService")
router = APIRouter()

DATASET_FILE = r"Open_sanctions_target_nested_json_dataset"

# Load dataset once at startup
try:
    sanction_dataset = load_dataset(DATASET_FILE)
    logger.info(f"Loaded {len(sanction_dataset)} sanction records.")
except Exception as e:
    logger.error(f"Error loading dataset: {e}")
    sanction_dataset = []


#---------------------------------------------------------------------

@router.get("/verify_identity", response_model=VerifyIdentityResponse)
def verify_identity(
    name: str,
    surname: str = "",
    entity_type: str = Query("person"),
    threshold: float = Query(80.0),
    phonetic: bool = Query(False),
    top_n: int = Query(5),
    db: Session = Depends(get_db)
):
    # Input validation
    if not name:
        raise HTTPException(status_code=400, detail="Name parameter is required")
    
    if threshold < 0 or threshold > 100:
        raise HTTPException(status_code=400, detail="Threshold must be between 0 and 100")
    
    # Log request details
    logger.info(f"Processing verify_identity request: name='{name}', surname='{surname}', type='{entity_type}', threshold={threshold}")
    
    # Construct query full name
    query_full_name = f"{name} {surname}".strip()
    logger.info(f"Constructed full name for matching: '{query_full_name}'")
    
    matches = []
    logger.info(f"Starting match process against {len(sanction_dataset)} records...")
    
    # Debug: Check if we have data
    if not sanction_dataset:
        logger.warning("No records in sanction dataset to match against!")

    # Track some metrics
    records_processed = 0
    potential_matches = 0

    for record in sanction_dataset:
        records_processed += 1
        
        # Filter based on selected type
        record_schema = getattr(record, 'schema', '').lower()
        if entity_type.lower() == "person" and record_schema != "person":
            continue
        elif entity_type.lower() != "person" and record_schema == "person":
            continue
        
        # Match the record
        logger.debug(f"Matching against record ID={getattr(record, 'id', 'unknown')}, caption='{getattr(record, 'caption', 'unknown')}'")
        score = match_record(query_full_name, record, use_phonetic=phonetic)
        
        if score >= threshold:
            potential_matches += 1
            logger.info(f"Match found with score {score} for record: {getattr(record, 'caption', 'unknown')}")
            
            props = getattr(record, 'properties', {})
            
            # Format match data differently based on entity type
            if entity_type.lower() == "person":
                # Safe extraction with fallbacks
                first_name = ""
                last_name = ""
                birth_date = "N/A"
                country = "N/A"
                
                # Extract first and last name
                if "firstName" in props and props["firstName"]:
                    first_name = props["firstName"][0]
                if "lastName" in props and props["lastName"]:
                    last_name = props["lastName"][0]
                    
                # Extract birth date
                if "birthDate" in props and props["birthDate"]:
                    birth_date = props["birthDate"][0]
                    
                # Extract country
                if "country" in props and props["country"]:
                    country = props["country"][0]

                # If names are missing, try to use record.name and record.surname
                if not first_name:
                    first_name = getattr(record, 'name', '')
                if not last_name:
                    last_name = getattr(record, 'surname', '')
                    
                # If still missing, use caption
                if not first_name and not last_name:
                    caption_parts = getattr(record, 'caption', '').split()
                    if caption_parts:
                        first_name = caption_parts[0]
                        if len(caption_parts) > 1:
                            last_name = ' '.join(caption_parts[1:])

                display_name = first_name
                
            else:  # Entity or Company                
                # For non-person entities
                name_list = props.get("name", [])
                if not name_list:
                    display_name = getattr(record, 'caption', 'Unknown Entity')
                else:
                    display_name = name_list[0]
                    
                country = "N/A"
                if "country" in props and props["country"]:
                    country = props["country"][0]
                    
                birth_date = "N/A"
                if "createdAt" in props and props["createdAt"]:
                    birth_date = props["createdAt"][0]
                
                # Entity-specific extra details
                reg_numbers = props.get("registrationNumber", ["N/A"])
                unique_ids = props.get("uniqueEntityId", ["N/A"])
                aliases = props.get("alias", [])

                # Format the properties for better display
                props_clean = {
                    "full_name": name_list or [display_name],
                    "aliases": aliases or [],
                    "registration_numbers": reg_numbers,
                    "unique_entity_ids": unique_ids,
                    "address": props.get("address", ["N/A"]),
                    "country": country,
                    "created_at": birth_date,
                    "topics": props.get("topics", ["N/A"])
                }
                
                # For non-person entities, we use the props_clean
                props = props_clean
                last_name = ""  # Empty for non-person entities

            # Create the match result
            matches.append(
                MatchResult(
                    name=display_name,
                    surname=last_name,
                    country=country,
                    birth_date=birth_date,
                    score=round(score, 2),
                    details={
                        "id": getattr(record, 'id', 'unknown'),
                        "caption": getattr(record, 'caption', 'unknown'),
                        "properties": props,
                        "datasets": getattr(record, 'datasets', []),
                        "referents": getattr(record, 'referents', []),
                        "first_seen": getattr(record, 'first_seen', ''),
                        "last_seen": getattr(record, 'last_seen', ''),
                        "last_change": getattr(record, 'last_change', ''),
                        "target": getattr(record, 'target', False)
                    }
                )
            )

    # Sort matches by score (highest first) and limit to top_n
    matches = sorted(matches, key=lambda x: x.score, reverse=True)[:top_n]
    status = "success" if matches else "no matches found"
    
    # Add timestamp
    search_time = datetime.now(timezone.utc).isoformat()
    
    # Log metrics
    logger.info(f"Search completed: processed {records_processed} records, found {potential_matches} potential matches, returning {len(matches)} matches")
    
    # Create log entry
    log_entry = {
        "timestamp": search_time,
        "query": {
            "name": name,
            "surname": surname,
            "entity_type": entity_type,
            "threshold": threshold,
            "phonetic": phonetic
        },
        "result": {
            "matches": [match.dict() for match in matches],
            "status": status
        }
    }
    
    # Log to database
    try:
        log_search(db, log_entry)
    except Exception as e:
        logger.error(f"Error logging search: {e}")
    
    # Create and return response
    return VerifyIdentityResponse(
        timestamp=search_time,
        matches=matches,
        status=status
    )


#---------------------------------------------------------------------

@router.post("/save_registration")
async def save_registration(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Process multipart form data
    form_data = await request.form()
    
    # Extract form fields from registration form
    registration_data = {}
    for key, value in form_data.items():
        # Skip file uploads which will be handled separately
        if not hasattr(value, "filename"):
            registration_data[key] = value

    
    # Extract user decision and search_log_id if available
    user_decision = registration_data.get("user_decision", None)
    search_log_id = registration_data.get("search_log_id", None)
    
    if search_log_id:
        try:
            search_log_id = int(search_log_id)
            logger.info(f"Received search_log_id: {search_log_id}")
        except (ValueError, TypeError):
            logger.warning(f"Invalid search_log_id format: {search_log_id}")
            search_log_id = None
    
    # Create output directory (cross-platform compatible)
    output_dir = os.path.join(os.path.expanduser("~"), "compliance_app_storage")
    # Alternative: output_dir = "./output"  # For project-relative path
    os.makedirs(output_dir, exist_ok=True)

    
    # Save registration data as a JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"registration_{timestamp}.json"
    json_path = os.path.join(output_dir, json_filename)
    
    with open(json_path, "w") as f:
        json.dump(registration_data, f, indent=2)
    


    # Save uploaded files
    saved_files = []
    saved_file_info = []  # New list to return more detailed info
    for key, value in form_data.items():
        if key.startswith("document_") and hasattr(value, "filename"):
            file = value
            file_path = os.path.join(output_dir, f"{timestamp}_{file.filename}")
            with open(file_path, "wb") as f:
                f.write(await file.read())
            saved_files.append(file_path)
            
            # Add more detailed file info
            saved_file_info.append({
                "original_name": file.filename,
                "server_path": file_path,
                "content_type": file.content_type
            })
    
    # Log the successful save
    logger.info(f"Registration saved: {json_path}")
    logger.info(f"Files saved: {saved_files}")
    
    # Handle the screenshot separately
    screenshot = registration_data.get("screenshot")
    if screenshot and isinstance(screenshot, str) and screenshot.startswith('data:image'):
        logger.info("Screenshot data URL received")
        # We're not saving it to disk here as it will be handled by the PDF generator
    
    # Log to database
    registration_entry = None
    try:
        # If this is connected to a previous search log, update the user decision
        if search_log_id and user_decision:
            # Get the existing search log entry
            search_log = db.query(LogEntry).filter(LogEntry.id == search_log_id).first()
            
            if search_log:
                # Update the user decision
                search_log.user_decision = user_decision
                db.commit()
                db.refresh(search_log)
                logger.info(f"✅ Updated search log {search_log_id} with decision: {user_decision}")
            else:
                logger.warning(f"⚠️ Search log with ID {search_log_id} not found")
                
                # Create a minimal search data as fallback
                search_data = {
                    "query": {
                        "name": registration_data.get("name", ""),
                        "surname": registration_data.get("surname", ""),
                        "threshold": registration_data.get("threshold", "80"),
                        "phonetic": "false"
                    },
                    "result": {
                        "matches": [],  # We don't have the original matches here
                        "status": "updated with decision"
                    }
                }
                # Log with the user's decision
                search_log = log_search(db, search_data, user_decision)
                search_log_id = search_log.id
                logger.info(f"✅ Created new search log with ID {search_log_id} and decision: {user_decision}")
        
        # Log the registration details in PostgreSQL
        from audit_log import log_registration
        registration_entry = log_registration(
            db, 
            search_log_id, 
            registration_data, 
            saved_files
        )
        logger.info(f"✅ Registration logged to database with ID: {registration_entry.id}")
    except Exception as e:
        logger.error(f"❌ Error logging to database: {e}", exc_info=True)
    
    # Get the registration ID if available
    registration_id = None
    if registration_entry:
        registration_id = registration_entry.id
    
    logger.info(f"Registration complete for {registration_data.get('name', '')} {registration_data.get('surname', '')}")
    

    return JSONResponse({
        "status": "success",
        "message": "Registration saved successfully",
        "data_file": json_path,
        "uploaded_files": saved_files,
        "file_details": saved_file_info,  # New field with more information
        "registration_id": registration_id
    })

#---------------------------------------------------------------------


def delayed_cleanup(directory_path):
    """
    Remove a temporary directory and all its contents after the response has been sent.
    
    Args:
        directory_path (str): Path to the temporary directory to be removed
    """
    try:
        shutil.rmtree(directory_path)
        logger.info(f"Cleaned up temporary directory: {directory_path}")
    except Exception as e:
        logger.error(f"Error cleaning up temporary directory {directory_path}: {e}")

###------------------------------------------------------------------------------
#PDF GENERATOR

# Fixed PDF generation endpoint in routes.py

@router.post("/generate_pdf")
async def generate_pdf(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate PDF with proper screenshot handling
    """
    logger.info("PDF generation request received")
    
    # Get form data
    form_data = await request.form()
    
    # Extract form fields
    name = form_data.get("name", "")
    surname = form_data.get("surname", "")
    transactionNumber = form_data.get("transactionNumber", "")
    transactionAmount = form_data.get("transactionAmount", "")
    euroEquivalent = form_data.get("euroEquivalent", "")
    address = form_data.get("address", "")
    documentNumber = form_data.get("documentNumber", "")
    documentIssuePlace = form_data.get("documentIssuePlace", "")
    telephone = form_data.get("telephone", "")
    email = form_data.get("email", "")
    salaryOrigin = form_data.get("salaryOrigin", "")
    transactionIntent = form_data.get("transactionIntent", "")
    transactionNature = form_data.get("transactionNature", "")
    suspicious = form_data.get("suspicious", "N")
    agentObservations = form_data.get("agentObservations", "")
    docNotes = form_data.get("docNotes", "")
    registration_id = form_data.get("registration_id", None)
    ocr_fields_json = form_data.get("ocr_fields", "[]")
    
    # Parse OCR fields
    try:
        ocr_fields = json.loads(ocr_fields_json) if ocr_fields_json else []
    except:
        ocr_fields = []
    
    logger.info(f"PDF generation for: {name} {surname} (reg_id={registration_id})")
    
    # FIXED: Handle screenshot properly
    screenshot = form_data.get("screenshot", "")
    screenshot_file = form_data.get("screenshot_file", None)
    
    # Debug log for screenshot
    if screenshot:
        logger.info(f"Screenshot data URL received, length: {len(screenshot)} chars")
        # Log first 100 chars to verify it's a data URL
        logger.debug(f"Screenshot preview: {screenshot[:100]}...")
    elif screenshot_file:
        logger.info(f"Screenshot file received: {screenshot_file.filename}")
    else:
        logger.warning("No screenshot data received")
    
    # Handle document files
    document_files = []
    
    # Check for document files in form data
    for key, value in form_data.items():
        if key.startswith("document_") and hasattr(value, "filename"):
            document_files.append(value)
            logger.info(f"Found document file: {key} = {value.filename}")
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    report_id = f"{transactionNumber or 'tx'}_{datetime.now():%Y%m%d_%H%M%S}"
    pdf_filename = f"compliance_report_{report_id}.pdf"
    pdf_temp_path = os.path.join(temp_dir, pdf_filename)


     # Permanent storage (cross-platform compatible)
    permanent_dir = os.path.join(os.path.expanduser("~"), "compliance_app_storage", "reports")
    # Alternative: permanent_dir = os.path.join(".", "storage", "reports")  # Project-relative path
    os.makedirs(permanent_dir, exist_ok=True)
    pdf_permanent_path = os.path.join(permanent_dir, pdf_filename)
    

    try:
        # If we have a screenshot file instead of data URL, read it
        if screenshot_file and not screenshot:
            screenshot_data = await screenshot_file.read()
            # Convert to data URL
            screenshot = f"data:image/png;base64,{base64.b64encode(screenshot_data).decode('utf-8')}"
            logger.info(f"Converted screenshot file to data URL, length: {len(screenshot)}")
        
        # Generate the PDF
        pdf_path = await generate_pdf_report(
            temp_dir=temp_dir,
            pdf_path=pdf_temp_path,
            permanent_pdf_path=pdf_permanent_path,
            name=name,
            surname=surname,
            transactionNumber=transactionNumber,
            transactionAmount=transactionAmount,
            euroEquivalent=euroEquivalent,
            address=address,
            documentNumber=documentNumber,
            documentIssuePlace=documentIssuePlace,
            telephone=telephone,
            email=email,
            salaryOrigin=salaryOrigin,
            transactionIntent=transactionIntent,
            transactionNature=transactionNature,
            suspicious=suspicious,
            agentObservations=agentObservations,
            docNotes=docNotes,
            screenshot=screenshot,  # Pass the full screenshot data
            document_files=document_files,
            ocr_fields=ocr_fields  # Pass OCR fields
        )
        
        # Update database if registration ID provided
        if registration_id:
            try:
                reg_id = int(registration_id)
                registration = db.query(CustomerRegistration).filter(CustomerRegistration.id == reg_id).first()
                if registration:
                    registration.pdf_path = pdf_permanent_path
                    db.commit()
                    logger.info(f"Updated registration {reg_id} with PDF path")
                else:
                    logger.warning(f"Registration {reg_id} not found in database")
            except ValueError:
                logger.error(f"Invalid registration ID format: {registration_id}")
        
        # Return the PDF file
        return FileResponse(
            path=pdf_path,
            filename=pdf_filename,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={pdf_filename}"
            }
        )
        
    except Exception as e:
        logger.error(f"PDF generation error: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"error": f"PDF generation failed: {str(e)}"}
        )
    
    finally:
        # Clean up temp directory after response is sent
        background_tasks.add_task(delayed_cleanup, temp_dir)



#--------------------------------------------------------------------------------



        #AIAgent
        # Initialize the AI Agent   
        
# Initialize AI agent
ai_agent = AIAgent()



#---------------------------------------------------------------------
# New Endpoints for OCR, AI, and PRADO
#---------------------------------------------------------------------

@router.post("/extract_identity_info")
async def ocr_extract_identity(file: UploadFile = File(...)):
    """
    Extract identity information from an uploaded ID document using OCR
    """
    logger.info(f"Received OCR request for file: {file.filename}, content-type: {file.content_type}")
    
    # Extract text from the image using OCR
    ocr_result = await extract_identity_info(file)
    
    if ocr_result["status"] == "error":
        logger.error(f"OCR extraction failed: {ocr_result['message']}")
        return JSONResponse(status_code=422, content=ocr_result)
    
    logger.info(f"OCR extraction successful, extracted {len(ocr_result['text'])} characters")
    return JSONResponse(ocr_result)

#---------------------------------------------------------------------




@router.post("/chat_with_ai")
async def ai_chat(query: str = Form(...), context: str = Form(None)):
    """
    Send a question to the AI assistant and get a response with PRADO context
    """
    logger.info(f"Received AI chat request: '{query}'")
    
    if not query.strip():
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "No question provided"}
        )
    
    # Get response from AI agent (now returns dict with text and pradoContext)
    ai_response = await ai_agent.answer_query(query, context)
    
    # Log PRADO context if present
    if ai_response.get("pradoContext"):
        prado_info = ai_response["pradoContext"]
        logger.info(f"PRADO context prepared: country={prado_info.get('country')}, doc_type={prado_info.get('document_type')}, url={prado_info.get('url')}")
    
    return JSONResponse({
        "status": "success",
        "response": ai_response["text"],
        "pradoContext": ai_response.get("pradoContext")
    })



#----------------------O C R And AI Interpretation----------------------------------------------------------------------------------

@router.post("/ocr_and_interpret")
async def ocr_and_interpret(
    file: Optional[UploadFile] = File(None),
    file_path: Optional[str] = Form(None),
    replace_previous: bool = Form(False),
    file2: Optional[UploadFile] = File(None),  # back side for recto/verso
):
    """Extract text via OCR then structure it with the AI agent.

    If `interpret_identity_document` returns an error, gracefully degrade to
    `partial_success`, returning the raw OCR text so the front‑end form can be
    filled manually.
    """

    # ------------------------------------------------------------------
    # 0. Which physical files are we dealing with?
    # ------------------------------------------------------------------
    front_file: UploadFile | str | None = None
    back_file: UploadFile | None = None

    if replace_previous and file:
        # Explicit replacement
        logger.info("Replacing previous upload with %s", file.filename)
        front_file, back_file = file, file2

    elif not file and file_path:
        # Re‑use existing server‑side file
        if not os.path.exists(file_path):
            return JSONResponse({"status": "error", "message": f"File not found: {file_path}"})
        front_file = file_path  # type: ignore[assignment]

    elif file:
        # Fresh upload
        front_file, back_file = file, file2
    else:
        return JSONResponse({"status": "error", "message": "No file or file path provided"})

    # ------------------------------------------------------------------
    # 1. OCR extraction – uses ocr_handler helper that supports multi‑page.
    # ------------------------------------------------------------------
    if isinstance(front_file, str):
        ocr_result = await ocr_handler.process_document(front_file, back_file)
    else:
        ocr_result = await (
            ocr_handler.process_document(front_file, back_file)
            if back_file else extract_identity_info(front_file)
        )

    if ocr_result["status"] == "error":
        logger.error("OCR failed: %s", ocr_result["message"])
        return JSONResponse(status_code=422, content=ocr_result)

    extracted_text: str = ocr_result["text"]
    extracted_dates = ocr_result.get("all_dates", [])
    is_multi_page = ocr_result.get("is_multi_page", False)

    logger.info("OCR success – %s chars extracted%s", len(extracted_text), " (multi‑page)" if is_multi_page else "")

    # ------------------------------------------------------------------
    # 2. AI interpretation – NEW robust error branch below
    # ------------------------------------------------------------------
    interpretation = await ai_agent.interpret_identity_document(extracted_text)

    # --------------------------------------------------------------
    # NEW ERROR HANDLING LOGIC (Step 2 enhancement)
    # --------------------------------------------------------------
    if isinstance(interpretation, dict) and "error" in interpretation:
        logger.error("AI interpretation failed: %s", interpretation["error"])

        # Special‑case: JSON parsing issues → show dedicated banner so the user
        # can manually correct the form while still seeing the raw OCR output.
        if "Failed to parse JSON" in interpretation.get("error", ""):
            return JSONResponse({
                "status": "partial_success",
                "message": (
                    "OCR successful but AI had trouble understanding the document "
                    "format. You can manually fill the form using the text below."
                ),
                "ocr_text": extracted_text,
                "data": {},  # empty dict keeps the front‑end happy
                "all_dates": extracted_dates,
                "is_multi_page": is_multi_page,
                "ai_note": "AI interpretation failed – manual review recommended",
            })

        # Fallback: other AI errors → generic partial success
        return JSONResponse({
            "status": "partial_success",
            "message": f"OCR successful but AI interpretation failed: {interpretation['error']}",
            "ocr_text": extracted_text,
            "all_dates": extracted_dates,
            "is_multi_page": is_multi_page,
        })

    # --------------------------------------------------------------
    # Success path – keep the existing sanity checks (string payload, etc.)
    # --------------------------------------------------------------
    if isinstance(interpretation, str):
        logger.warning("AI returned raw string; attempting JSON decode…")
        try:
            interpretation = json.loads(interpretation)
        except json.JSONDecodeError:
            return JSONResponse({
                "status": "partial_success",
                "message": "OCR successful but AI interpretation returned invalid format",
                "ocr_text": extracted_text,
                "all_dates": extracted_dates,
                "ai_response": interpretation[:500],
            })

    if not isinstance(interpretation, dict):
        return JSONResponse({
            "status": "partial_success",
            "message": f"OCR successful but AI interpretation returned unexpected type: {type(interpretation)}",
            "ocr_text": extracted_text,
            "all_dates": extracted_dates,
        })

    if not any(v for v in interpretation.values() if v):
        return JSONResponse({
            "status": "partial_success",
            "message": "OCR successful but no useful information could be extracted",
            "ocr_text": extracted_text,
            "data": interpretation,
            "all_dates": extracted_dates,
        })

    extracted_fields = [k for k, v in interpretation.items() if v]
    logger.info("AI interpretation success – fields: %s", ", ".join(extracted_fields))

    return JSONResponse({
        "status": "success",
        "data": interpretation,
        "ocr_text": extracted_text,
        "all_dates": extracted_dates,
        "is_multi_page": is_multi_page,
    })

# ----------------------------- Prado URL Preparation Endpoint -----------------------------

from prado import PradoService, get_prado_url

# Add this endpoint after the existing PRADO endpoint
@router.post("/prepare_prado_url")
async def prepare_prado_url(
    query: str = Form(None),
    country: str = Form(None),
    document_type: str = Form(None),
    extracted_data: str = Form(None)  # JSON string of OCR data
):
    """
    Prepare PRADO URL based on different inputs:
    - Natural language query
    - Direct country/document type
    - OCR extracted data
    """
    logger.info(f"PRADO URL preparation request: query='{query}', country='{country}', doc_type='{document_type}'")
    
    # Case 1: Direct country and document type provided
    if country and document_type:
        result = get_prado_url(country, document_type)
        return JSONResponse(result)
    
    # Case 2: OCR data provided
    if extracted_data:
        try:
            data = json.loads(extracted_data)
            # Look for country in the extracted data
            detected_country = data.get("country") or data.get("document_issue_place", "").split(",")[0].strip()
            if detected_country:
                result = get_prado_url(detected_country, "identity card")
                return JSONResponse(result)
        except Exception as e:
            logger.error(f"Error parsing extracted data: {e}")
    
    # Case 3: Natural language query
    if query:
        # Use AI to parse the query
        ai_result = await ai_agent.prepare_prado_url(query)
        if ai_result["status"] == "success":
            result = get_prado_url(
                ai_result.get("country", ""),
                ai_result.get("document_type", "identity card")
            )
            return JSONResponse(result)
    
    # Case 4: No input - return main PRADO page
    return JSONResponse({
        "status": "success",
        "url": "https://www.consilium.europa.eu/prado/en/search-by-document-country.html",
        "message": "Opening main PRADO page"
    })


#--------------------------------- END OF  P R A D O   ENDPOINT---------------------------------
