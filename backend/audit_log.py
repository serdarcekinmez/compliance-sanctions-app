


#audit_log.py

import json
import logging
from sqlalchemy.orm import Session
from db_models import LogEntry, CustomerRegistration

logger = logging.getLogger("AuditLog")

def log_search(db: Session, search_data: dict, user_decision: str = None):
    """
    Persists a search log entry in the PostgreSQL database.
    
    Args:
        db (Session): SQLAlchemy database session
        search_data (dict): Search data including query and results
        user_decision (str, optional): User's decision ("match", "no_match", or None)
    """
    try:
        # Debug print all fields before committing to DB
        logger.info(f"Search Query Name: {search_data['query']['name']}")
        logger.info(f"Search Query Surname: {search_data['query']['surname']}")
        logger.info(f"Search Result Status: {search_data['result']['status']}")
        if user_decision:
            logger.info(f"User Decision: {user_decision}")

        # Encode all fields to UTF-8 safely
        query_name = search_data["query"]["name"].encode("utf-8", "ignore").decode("utf-8")
        query_surname = search_data["query"]["surname"].encode("utf-8", "ignore").decode("utf-8")
        threshold = str(search_data["query"]["threshold"])
        phonetic = str(search_data["query"]["phonetic"])

        # Convert matches into a JSON string and print it
        matches_json = json.dumps(search_data["result"]["matches"], ensure_ascii=False).encode("utf-8", "ignore").decode("utf-8")
        logger.info(f"Processed Matches JSON: {matches_json}")

        # Ensure the status field is UTF-8 encoded
        status = search_data["result"]["status"].encode("utf-8", "ignore").decode("utf-8")

        # Print final log entry before inserting into DB
        logger.info(f"Final Log Entry -> Name: {query_name}, Surname: {query_surname}, Matches: {matches_json}")

        entry = LogEntry(
            query_name=query_name,
            query_surname=query_surname,
            threshold=threshold,
            phonetic=phonetic,
            matches=matches_json,
            status=status,
            user_decision=user_decision
        )

        db.add(entry)
        db.commit()
        db.refresh(entry)
    
    except UnicodeDecodeError as e:
        logger.error(f"❌ Encoding issue in database insertion: {e}")
        raise e
    
    except Exception as e:
        logger.error(f"❌ General Error logging search: {e}")
        raise e

    return entry

def log_registration(db: Session, search_log_id: int, registration_data: dict, document_paths: list, pdf_path: str = None):
    """
    Persists a customer registration entry in the PostgreSQL database.
    
    Args:
        db (Session): SQLAlchemy database session
        search_log_id (int): ID of the associated search log entry
        registration_data (dict): Customer registration data
        document_paths (list): List of paths to saved documents
        pdf_path (str, optional): Path to the generated PDF
    """
    try:
        # Convert document paths to JSON string
        document_paths_json = json.dumps(document_paths, ensure_ascii=False)
        
        logger.info(f"Logging registration for transaction {registration_data.get('transactionNumber', 'N/A')}")
        
        # Create new registration entry
        entry = CustomerRegistration(
            search_log_id=search_log_id,
            transaction_number=registration_data.get("transactionNumber", ""),
            name=registration_data.get("name", ""),
            surname=registration_data.get("surname", ""),
            transaction_amount=registration_data.get("transactionAmount", ""),
            euro_equivalent=registration_data.get("euroEquivalent", ""),
            address=registration_data.get("address", ""),
            document_number=registration_data.get("documentNumber", ""),
            document_issue_place=registration_data.get("documentIssuePlace", ""),
            telephone=registration_data.get("telephone", ""),
            email=registration_data.get("email", ""),
            salary_origin=registration_data.get("salaryOrigin", ""),
            transaction_intent=registration_data.get("transactionIntent", ""),
            transaction_nature=registration_data.get("transactionNature", ""),
            suspicious=registration_data.get("suspicious", "N"),
            agent_observations=registration_data.get("agentObservations", ""),
            doc_notes=registration_data.get("docNotes", ""),
            document_paths=document_paths_json,
            pdf_path=pdf_path
        )
        
        db.add(entry)
        db.commit()
        db.refresh(entry)
        
        logger.info(f"Registration logged successfully with ID: {entry.id}")
        return entry
        
    except Exception as e:
        logger.error(f"❌ Error logging registration: {e}")
        raise e