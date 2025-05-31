#matching.py

import textdistance
from rapidfuzz import fuzz
import logging
from models import SanctionRecord
from data_ingestion import normalize_text

logger = logging.getLogger("ComplianceService")

def phonetic_key_soundex(name: str) -> str:
    """
    Compute the Soundex phonetic key for a given name.
    """
    if not name:
        return ""
    return textdistance.soundex(name)

def string_similarity(a: str, b: str) -> float:
    """
    Compute string similarity using a Levenshtein-based ratio.
    Returns a score between 0 and 100.
    """
    if not a or not b:
        return 0.0
    return fuzz.ratio(a, b)

def combined_similarity_score(query_name: str, record_name: str, use_phonetic: bool = False) -> float:
    """
    Combine phonetic and string-based similarity scores.
    If phonetic matching is enabled, both scores are computed and combined;
    otherwise, only the textual similarity is used.
    """
    # Safety check for empty inputs
    if not query_name or not record_name:
        return 0.0
        
    # Normalize both inputs
    query_name = normalize_text(query_name)
    record_name = normalize_text(record_name)
    
    # If either is empty after normalization, return 0
    if not query_name or not record_name:
        return 0.0
    
    # Calculate text similarity score
    text_score = string_similarity(query_name, record_name)
    
    if use_phonetic:
        # Calculate phonetic similarity
        q_phonetic = phonetic_key_soundex(query_name)
        r_phonetic = phonetic_key_soundex(record_name)
        
        # If either phonetic key is empty, use just the text score
        if not q_phonetic or not r_phonetic:
            return text_score
            
        phonetic_score = 100.0 if q_phonetic == r_phonetic else 0.0
        
        # Weighted average: 40% phonetic, 60% textual
        final_score = 0.4 * phonetic_score + 0.6 * text_score
    else:
        final_score = text_score
        
    return final_score

def match_reversed_names(query: str, name: str, surname: str, use_phonetic: bool = False) -> float:
    """
    Match a query against both normal and reversed name order.
    Returns the highest similarity score found.
    """
    max_score = 0.0
    
    # Try normal order: "firstname lastname"
    normal_order = f"{name} {surname}".strip()
    if normal_order:
        score = combined_similarity_score(query, normal_order, use_phonetic)
        max_score = max(max_score, score)
        logger.debug(f"Normal order score for '{normal_order}': {score}")
    
    # Try reversed order: "lastname firstname"
    reversed_order = f"{surname} {name}".strip()
    if reversed_order and reversed_order != normal_order:  # Avoid duplicate if one is empty
        score = combined_similarity_score(query, reversed_order, use_phonetic)
        max_score = max(max_score, score)
        logger.debug(f"Reversed order score for '{reversed_order}': {score}")
    
    return max_score

def match_name_parts(query: str, name: str, surname: str, use_phonetic: bool = False) -> float:
    """
    Match query against individual name parts and their combinations.
    This helps with cases where only partial names are used.
    """
    max_score = 0.0
    query_parts = query.split()
    
    if len(query_parts) >= 2:
        # If query has multiple parts, try matching each part against name/surname
        for i, part in enumerate(query_parts):
            # Match first part of query against first name
            if i == 0 and name:
                score = combined_similarity_score(part, name, use_phonetic)
                if score > 70:  # If good match on first name
                    # Check if remaining query matches surname
                    remaining_query = " ".join(query_parts[1:])
                    surname_score = combined_similarity_score(remaining_query, surname, use_phonetic)
                    combined_score = (score + surname_score) / 2
                    max_score = max(max_score, combined_score)
                    
            # Match against surname
            if surname:
                score = combined_similarity_score(part, surname, use_phonetic)
                if score > 70:  # If good match on surname
                    # Check if other parts match first name
                    other_parts = query_parts[:i] + query_parts[i+1:]
                    if other_parts:
                        other_query = " ".join(other_parts)
                        name_score = combined_similarity_score(other_query, name, use_phonetic)
                        combined_score = (score + name_score) / 2
                        max_score = max(max_score, combined_score)
    
    return max_score

def match_record(query: str, record: SanctionRecord, use_phonetic: bool = False) -> float:
    """
    Match a query (full name) against a sanction record by comparing the full name and any aliases.
    Now handles reversed names and partial matches better.
    Returns the highest similarity score found.
    """
    try:
        # Normalize query text
        query = normalize_text(query)
        if not query:
            logger.warning("Empty query after normalization")
            return 0.0
            
        # Initial score is 0
        max_score = 0.0
        
        # Check record schema
        is_person = hasattr(record, 'schema') and record.schema.lower() == "person"
        
        # For person records
        if is_person:
            # Get name and surname safely
            name = getattr(record, 'name', '')
            surname = getattr(record, 'surname', '')
            
            # Try both normal and reversed order
            reversed_score = match_reversed_names(query, name, surname, use_phonetic)
            max_score = max(max_score, reversed_score)
            
            # Try matching individual parts for partial matches
            parts_score = match_name_parts(query, name, surname, use_phonetic)
            max_score = max(max_score, parts_score)
            
            # Check name and surname separately for single name queries
            query_parts = query.split()
            if len(query_parts) == 1:
                # Single word query - check against both name and surname
                if name:
                    name_score = combined_similarity_score(query, name, use_phonetic)
                    max_score = max(max_score, name_score * 0.9)  # Slightly reduced weight for single name
                    logger.debug(f"Single name match for '{name}': {name_score}")
                    
                if surname:
                    surname_score = combined_similarity_score(query, surname, use_phonetic)
                    max_score = max(max_score, surname_score * 0.9)  # Slightly reduced weight for single name
                    logger.debug(f"Single surname match for '{surname}': {surname_score}")
                
        else:
            # For non-person records, use caption or name property
            entity_name = ""
            
            # Try to get name from properties
            if hasattr(record, 'properties') and record.properties:
                props = record.properties
                name_list = props.get("name", [])
                if name_list:
                    entity_name = name_list[0]
            
            # If no name found in properties, use caption
            if not entity_name and hasattr(record, 'caption'):
                entity_name = record.caption
                
            # Match against entity name
            if entity_name:
                score = combined_similarity_score(query, entity_name, use_phonetic)
                max_score = max(max_score, score)
                logger.debug(f"Entity name score for '{entity_name}': {score}")
        
        # Check against aliases - also try reversed for aliases
        aliases = getattr(record, 'aliases', []) or []
        for alias in aliases:
            if alias:
                # Direct alias match
                alias_score = combined_similarity_score(query, alias, use_phonetic)
                max_score = max(max_score, alias_score)
                logger.debug(f"Alias score for '{alias}': {alias_score}")
                
                # If alias contains spaces, try reversed
                alias_parts = alias.split()
                if len(alias_parts) >= 2:
                    reversed_alias = " ".join(reversed(alias_parts))
                    reversed_alias_score = combined_similarity_score(query, reversed_alias, use_phonetic)
                    max_score = max(max_score, reversed_alias_score)
                    logger.debug(f"Reversed alias score for '{reversed_alias}': {reversed_alias_score}")
                
        logger.debug(f"Final max score for record: {max_score}")
        return max_score
        
    except Exception as e:
        logger.error(f"Error in match_record: {e}")
        return 0.0