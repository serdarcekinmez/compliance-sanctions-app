


#data_ingetion.py

import json
import unicodedata
import re
import logging
from typing import List, Dict, Any
from models import SanctionRecord

logger = logging.getLogger("ComplianceService")

def normalize_text(text: str) -> str:
    """Normalize text by removing accents, converting to lowercase, and removing special characters."""
    if not isinstance(text, str):
        return ""
    
    text = ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return text.strip()

def load_dataset(file_path: str) -> List[SanctionRecord]:
    """Load and parse the sanctions dataset from a file."""
    sanction_records = []
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line)
                    entity_schema = record.get("schema", "").lower()
                    props = record.get("properties", {})
                    
                    # Create a base SanctionRecord instance
                    sanction_record = SanctionRecord(
                        id=record.get("id", ""),
                        caption=record.get("caption", ""),
                        schema=record.get("schema", ""),
                        properties=props,
                        referents=record.get("referents", []),
                        datasets=record.get("datasets", []),
                        first_seen=record.get("first_seen", ""),
                        last_seen=record.get("last_seen", ""),
                        last_change=record.get("last_change", ""),
                        target=record.get("target", False),
                        aliases=[]  # Initialize with empty list
                    )
                    
                    # Extract and add person-specific fields
                    if entity_schema == "person":
                        # Handle first name
                        first_names = props.get("firstName", [])
                        first_name = first_names[0] if first_names and first_names[0] else ""
                        
                        # Handle last name
                        last_names = props.get("lastName", [])
                        last_name = last_names[0] if last_names and last_names[0] else ""
                        
                        # If first_name or last_name is missing but we have a name field
                        if (not first_name or not last_name) and "name" in props and props["name"]:
                            full_name = props["name"][0]
                            parts = full_name.split()
                            if parts:
                                if not first_name:
                                    first_name = parts[0]
                                if not last_name and len(parts) > 1:
                                    last_name = parts[-1]
                        
                        # If we still don't have names, try to use caption
                        if not first_name and not last_name:
                            parts = record.get("caption", "").split()
                            if parts:
                                first_name = parts[0]
                                if len(parts) > 1:
                                    last_name = parts[-1]
                        
                        # Set normalized names
                        sanction_record.name = normalize_text(first_name)
                        sanction_record.surname = normalize_text(last_name)
                        
                        # Handle aliases
                        aliases = props.get("alias", [])
                        sanction_record.aliases = [normalize_text(a) for a in aliases if a]
                        
                    else:  # For non-person records
                        # For companies or other entities, use name fields or caption
                        names = props.get("name", [])
                        entity_name = names[0] if names else record.get("caption", "")
                        
                        # Store the name in both name fields for consistency in matching
                        sanction_record.name = normalize_text(entity_name)
                        sanction_record.surname = ""  # Empty for non-person entities
                        
                        # Handle aliases for non-person entities
                        aliases = props.get("alias", [])
                        sanction_record.aliases = [normalize_text(a) for a in aliases if a]
                    
                    sanction_records.append(sanction_record)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Error parsing JSON line: {e}")
                except Exception as e:
                    logger.error(f"Error processing record: {e}")
                    
        logger.info(f"Successfully loaded {len(sanction_records)} records from dataset")
        
    except Exception as e:
        logger.error(f"Error opening or reading dataset file: {e}")
        raise
        
    return sanction_records