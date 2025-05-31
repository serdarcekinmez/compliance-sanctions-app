




# create_tables.py
# Run this script to ensure both tables are properly created in the database

from sqlalchemy import create_engine
from db_models import Base, LogEntry, CustomerRegistration
from config import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SchemaCreation")

def create_tables():
    """Create all database tables if they don't exist"""
    try:
        # Create engine
        engine = create_engine(DATABASE_URL)
        
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(engine)
        
        # Verify tables
        inspector = engine.dialect.inspector
        tables = inspector.get_table_names()
        logger.info(f"Tables in database: {tables}")
        
        # Verify columns in each table
        if "search_logs" in tables:
            columns = {col['name'] for col in inspector.get_columns("search_logs")}
            expected_columns = {"id", "timestamp", "query_name", "query_surname", "threshold", "phonetic", "matches", "status", "user_decision"}
            missing = expected_columns - columns
            if missing:
                logger.warning(f"Missing columns in search_logs: {missing}")
            else:
                logger.info("search_logs table has all expected columns")
        
        if "customer_registrations" in tables:
            columns = {col['name'] for col in inspector.get_columns("customer_registrations")}
            expected_columns = {
                "id", "timestamp", "search_log_id", "transaction_number", "name", "surname", 
                "transaction_amount", "euro_equivalent", "address", "document_number", 
                "document_issue_place", "telephone", "email", "salary_origin", 
                "transaction_intent", "transaction_nature", "suspicious", 
                "agent_observations", "doc_notes", "document_paths", "pdf_path"
            }
            missing = expected_columns - columns
            if missing:
                logger.warning(f"Missing columns in customer_registrations: {missing}")
            else:
                logger.info("customer_registrations table has all expected columns")
        
        logger.info("Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        return False

if __name__ == "__main__":
    create_tables()