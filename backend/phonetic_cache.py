




# phonetic_cache.py

import textdistance
from typing import Dict

# A global dictionary to store phonetic keys, keyed by record ID or index.
PHONETIC_CACHE: Dict[int, str] = {}

def compute_phonetic_key(full_name: str) -> str:
    """
    Compute the Soundex key for a given name or full_name.
    """
    return textdistance.soundex(full_name)
