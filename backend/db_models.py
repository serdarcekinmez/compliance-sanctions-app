




# db_models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class LogEntry(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    query_name = Column(String(100))
    query_surname = Column(String(100))
    threshold = Column(String(10))
    phonetic = Column(String(5))
    matches = Column(Text)     # JSON or text representation of matches
    status = Column(String(50))
    user_decision = Column(String(20))  # "match", "no_match", or null

class CustomerRegistration(Base):
    __tablename__ = "customer_registrations"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    search_log_id = Column(Integer)  # Link to the search log entry
    transaction_number = Column(String(50))
    name = Column(String(100))
    surname = Column(String(100))
    transaction_amount = Column(String(50))
    euro_equivalent = Column(String(50))
    address = Column(Text)
    document_number = Column(String(100))
    document_issue_place = Column(String(100))
    telephone = Column(String(50))
    email = Column(String(100))
    salary_origin = Column(String(100))
    transaction_intent = Column(Text)
    transaction_nature = Column(String(50))
    suspicious = Column(String(1))  # "Y" or "N"
    agent_observations = Column(Text)
    doc_notes = Column(Text)
    document_paths = Column(Text)  # JSON array of saved document paths
    pdf_path = Column(String(255))  # Path to the generated PDF