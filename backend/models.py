


#models.py

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field



class SanctionRecord(BaseModel):
    id: str
    caption: str
    schema: str
    properties: Dict
    referents: List[str]
    datasets: List[str]
    first_seen: str
    last_seen: str
    last_change: str
    target: bool
    # Add these fields with default values to avoid attribute errors
    name: Optional[str] = ""
    surname: Optional[str] = ""
    aliases: List[str] = Field(default_factory=list)

class VerifyIdentityRequest(BaseModel):
    name: str
    surname: str = ""
    entity_type: str = "person"
    threshold: float = 80.0
    phonetic: bool = False
    top_n: int = 5

class MatchResult(BaseModel):
    name: str
    surname: str = ""
    country: Optional[str] = None
    birth_date: Optional[str] = None
    score: float
    details: Dict

class VerifyIdentityResponse(BaseModel):
    timestamp: str
    matches: List[MatchResult]
    status: str

# New models for OCR and AI functionality

class OCRRequest(BaseModel):
    file_path: str

class OCRResponse(BaseModel):
    status: str
    text: Optional[str] = None
    message: Optional[str] = None

class AIInterpretationRequest(BaseModel):
    text: str

class AIInterpretationResponse(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

class IdentityInfo(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    document_number: Optional[str] = None
    birth_date: Optional[str] = None
    birth_place: Optional[str] = None
    document_issue_place: Optional[str] = None
    validity_date: Optional[str] = None
    address: Optional[str] = None

class AIQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None

class AIQueryResponse(BaseModel):
    status: str
    response: str

class PradoRequest(BaseModel):
    query: Optional[str] = None
    country: Optional[str] = None

class PradoResponse(BaseModel):
    url: str
    description: str
    extracted_country: Optional[str] = None
    extracted_document_type: Optional[str] = None
    error: Optional[str] = None