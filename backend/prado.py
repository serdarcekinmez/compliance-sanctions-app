



#!/usr/bin/env python3
# prado.py - PRADO document verification integration module
"""
PRADO (Public Register of Authentic travel and identity Documents Online) integration module.
This module provides functionality to generate PRADO URLs for document verification
and integrates with AI analysis for automated country detection.
"""

import logging
import json
import time
import webbrowser
import asyncio
import re
from typing import Dict, List, Optional, Union, Any, TYPE_CHECKING
from fastapi import UploadFile

# Avoid circular import at runtime
if TYPE_CHECKING:
    from ai_agent import AIAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ComplianceService.PRADO")

# URL templates for PRADO
PRADO_BASE_URL = "https://www.consilium.europa.eu/prado/en"
PRADO_COUNTRY_URL_TEMPLATE = f"{PRADO_BASE_URL}/prado-documents/{{abbr}}/index.html"
PRADO_DOCUMENT_URL_TEMPLATE = f"{PRADO_BASE_URL}/prado-documents/{{abbr}}/{{doc_type}}/docs-per-category.html"
PRADO_SEARCH_URL = f"{PRADO_BASE_URL}/search-by-document-country.html"

# Document type codes
DOCUMENT_TYPE_CODES = {
    "passport": "A",
    "id card": "B",
    "identity card": "B",
    "national id": "B",
    "residence permit": "H",
    "visa": "C",
    "driving license": "F",
    "driver license": "F",
    "driver's license": "F",
    "travel document": "J",
}

# Comprehensive country code mapping
COUNTRY_CODES = {
    "afghanistan": {"iso": "AF", "abbr": "AFG"},
    "albania": {"iso": "AL", "abbr": "ALB"},
    "algeria": {"iso": "DZ", "abbr": "DZA"},
    "andorra": {"iso": "AD", "abbr": "AND"},
    "angola": {"iso": "AO", "abbr": "AGO"},
    "anguilla": {"iso": "AI", "abbr": "AIA"},
    "argentina": {"iso": "AR", "abbr": "ARG"},
    "armenia": {"iso": "AM", "abbr": "ARM"},
    "australia": {"iso": "AU", "abbr": "AUS"},
    "austria": {"iso": "AT", "abbr": "AUT"},
    "azerbaijan": {"iso": "AZ", "abbr": "AZE"},
    "bahamas": {"iso": "BS", "abbr": "BHS"},
    "bahrain": {"iso": "BH", "abbr": "BHR"},
    "bangladesh": {"iso": "BD", "abbr": "BGD"},
    "belarus": {"iso": "BY", "abbr": "BLR"},
    "belgium": {"iso": "BE", "abbr": "BEL"},
    "belize": {"iso": "BZ", "abbr": "BLZ"},
    "benin": {"iso": "BJ", "abbr": "BEN"},
    "bermuda": {"iso": "BM", "abbr": "BMU"},
    "bhutan": {"iso": "BT", "abbr": "BTN"},
    "bolivia": {"iso": "BO", "abbr": "BOL"},
    "bosnia and herzegovina": {"iso": "BA", "abbr": "BIH"},
    "botswana": {"iso": "BW", "abbr": "BWA"},
    "brazil": {"iso": "BR", "abbr": "BRA"},
    "brunei": {"iso": "BN", "abbr": "BRN"},
    "bulgaria": {"iso": "BG", "abbr": "BGR"},
    "burkina faso": {"iso": "BF", "abbr": "BFA"},
    "burundi": {"iso": "BI", "abbr": "BDI"},
    "cambodia": {"iso": "KH", "abbr": "KHM"},
    "cameroon": {"iso": "CM", "abbr": "CMR"},
    "canada": {"iso": "CA", "abbr": "CAN"},
    "cape verde": {"iso": "CV", "abbr": "CPV"},
    "central african republic": {"iso": "CF", "abbr": "CAF"},
    "chad": {"iso": "TD", "abbr": "TCD"},
    "chile": {"iso": "CL", "abbr": "CHL"},
    "china": {"iso": "CN", "abbr": "CHN"},
    "colombia": {"iso": "CO", "abbr": "COL"},
    "comoros": {"iso": "KM", "abbr": "COM"},
    "congo": {"iso": "CG", "abbr": "COG"},
    "congo (democratic republic)": {"iso": "CD", "abbr": "COD"},
    "costa rica": {"iso": "CR", "abbr": "CRI"},
    "croatia": {"iso": "HR", "abbr": "HRV"},
    "cuba": {"iso": "CU", "abbr": "CUB"},
    "cyprus": {"iso": "CY", "abbr": "CYP"},
    "czechia": {"iso": "CZ", "abbr": "CZE"},
    "denmark": {"iso": "DK", "abbr": "DNK"},
    "djibouti": {"iso": "DJ", "abbr": "DJI"},
    "dominica": {"iso": "DM", "abbr": "DMA"},
    "dominican republic": {"iso": "DO", "abbr": "DOM"},
    "ecuador": {"iso": "EC", "abbr": "ECU"},
    "egypt": {"iso": "EG", "abbr": "EGY"},
    "el salvador": {"iso": "SV", "abbr": "SLV"},
    "equatorial guinea": {"iso": "GQ", "abbr": "GNQ"},
    "eritrea": {"iso": "ER", "abbr": "ERI"},
    "estonia": {"iso": "EE", "abbr": "EST"},
    "eswatini": {"iso": "SZ", "abbr": "SWZ"},
    "ethiopia": {"iso": "ET", "abbr": "ETH"},
    "fiji": {"iso": "FJ", "abbr": "FJI"},
    "finland": {"iso": "FI", "abbr": "FIN"},
    "france": {"iso": "FR", "abbr": "FRA"},
    "gabon": {"iso": "GA", "abbr": "GAB"},
    "gambia": {"iso": "GM", "abbr": "GMB"},
    "georgia": {"iso": "GE", "abbr": "GEO"},
    "germany": {"iso": "DE", "abbr": "DEU"},
    "ghana": {"iso": "GH", "abbr": "GHA"},
    "greece": {"iso": "GR", "abbr": "GRC"},
    "greenland": {"iso": "GL", "abbr": "GRL"},
    "grenada": {"iso": "GD", "abbr": "GRD"},
    "guatemala": {"iso": "GT", "abbr": "GTM"},
    "guinea": {"iso": "GN", "abbr": "GIN"},
    "guinea-bissau": {"iso": "GW", "abbr": "GNB"},
    "guyana": {"iso": "GY", "abbr": "GUY"},
    "haiti": {"iso": "HT", "abbr": "HTI"},
    "honduras": {"iso": "HN", "abbr": "HND"},
    "hungary": {"iso": "HU", "abbr": "HUN"},
    "iceland": {"iso": "IS", "abbr": "ISL"},
    "india": {"iso": "IN", "abbr": "IND"},
    "indonesia": {"iso": "ID", "abbr": "IDN"},
    "iran": {"iso": "IR", "abbr": "IRN"},
    "iraq": {"iso": "IQ", "abbr": "IRQ"},
    "ireland": {"iso": "IE", "abbr": "IRL"},
    "israel": {"iso": "IL", "abbr": "ISR"},
    "italy": {"iso": "IT", "abbr": "ITA"},
    "jamaica": {"iso": "JM", "abbr": "JAM"},
    "japan": {"iso": "JP", "abbr": "JPN"},
    "jordan": {"iso": "JO", "abbr": "JOR"},
    "kazakhstan": {"iso": "KZ", "abbr": "KAZ"},
    "kenya": {"iso": "KE", "abbr": "KEN"},
    "kiribati": {"iso": "KI", "abbr": "KIR"},
    "korea (north)": {"iso": "KP", "abbr": "PRK"},
    "korea (south)": {"iso": "KR", "abbr": "KOR"},
    "kuwait": {"iso": "KW", "abbr": "KWT"},
    "kyrgyzstan": {"iso": "KG", "abbr": "KGZ"},
    "laos": {"iso": "LA", "abbr": "LAO"},
    "latvia": {"iso": "LV", "abbr": "LVA"},
    "lebanon": {"iso": "LB", "abbr": "LBN"},
    "lesotho": {"iso": "LS", "abbr": "LSO"},
    "liberia": {"iso": "LR", "abbr": "LBR"},
    "libya": {"iso": "LY", "abbr": "LBY"},
    "liechtenstein": {"iso": "LI", "abbr": "LIE"},
    "lithuania": {"iso": "LT", "abbr": "LTU"},
    "luxembourg": {"iso": "LU", "abbr": "LUX"},
    "madagascar": {"iso": "MG", "abbr": "MDG"},
    "malawi": {"iso": "MW", "abbr": "MWI"},
    "malaysia": {"iso": "MY", "abbr": "MYS"},
    "maldives": {"iso": "MV", "abbr": "MDV"},
    "mali": {"iso": "ML", "abbr": "MLI"},
    "malta": {"iso": "MT", "abbr": "MLT"},
    "marshall islands": {"iso": "MH", "abbr": "MHL"},
    "mauritania": {"iso": "MR", "abbr": "MRT"},
    "mauritius": {"iso": "MU", "abbr": "MUS"},
    "mexico": {"iso": "MX", "abbr": "MEX"},
    "micronesia": {"iso": "FM", "abbr": "FSM"},
    "moldova": {"iso": "MD", "abbr": "MDA"},
    "monaco": {"iso": "MC", "abbr": "MCO"},
    "mongolia": {"iso": "MN", "abbr": "MNG"},
    "montenegro": {"iso": "ME", "abbr": "MNE"},
    "morocco": {"iso": "MA", "abbr": "MAR"},
    "mozambique": {"iso": "MZ", "abbr": "MOZ"},
    "myanmar": {"iso": "MM", "abbr": "MMR"},
    "namibia": {"iso": "NA", "abbr": "NAM"},
    "nauru": {"iso": "NR", "abbr": "NRU"},
    "nepal": {"iso": "NP", "abbr": "NPL"},
    "netherlands": {"iso": "NL", "abbr": "NLD"},
    "new zealand": {"iso": "NZ", "abbr": "NZL"},
    "nicaragua": {"iso": "NI", "abbr": "NIC"},
    "niger": {"iso": "NE", "abbr": "NER"},
    "nigeria": {"iso": "NG", "abbr": "NGA"},
    "north macedonia": {"iso": "MK", "abbr": "MKD"},
    "norway": {"iso": "NO", "abbr": "NOR"},
    "oman": {"iso": "OM", "abbr": "OMN"},
    "pakistan": {"iso": "PK", "abbr": "PAK"},
    "palau": {"iso": "PW", "abbr": "PLW"},
    "palestine": {"iso": "PS", "abbr": "PSE"},
    "panama": {"iso": "PA", "abbr": "PAN"},
    "papua new guinea": {"iso": "PG", "abbr": "PNG"},
    "paraguay": {"iso": "PY", "abbr": "PRY"},
    "peru": {"iso": "PE", "abbr": "PER"},
    "philippines": {"iso": "PH", "abbr": "PHL"},
    "poland": {"iso": "PL", "abbr": "POL"},
    "portugal": {"iso": "PT", "abbr": "PRT"},
    "qatar": {"iso": "QA", "abbr": "QAT"},
    "romania": {"iso": "RO", "abbr": "ROU"},
    "russia": {"iso": "RU", "abbr": "RUS"},
    "rwanda": {"iso": "RW", "abbr": "RWA"},
    "saint kitts and nevis": {"iso": "KN", "abbr": "KNA"},
    "saint lucia": {"iso": "LC", "abbr": "LCA"},
    "saint vincent and the grenadines": {"iso": "VC", "abbr": "VCT"},
    "samoa": {"iso": "WS", "abbr": "WSM"},
    "san marino": {"iso": "SM", "abbr": "SMR"},
    "sao tome and principe": {"iso": "ST", "abbr": "STP"},
    "saudi arabia": {"iso": "SA", "abbr": "SAU"},
    "senegal": {"iso": "SN", "abbr": "SEN"},
    "serbia": {"iso": "RS", "abbr": "SRB"},
    "seychelles": {"iso": "SC", "abbr": "SYC"},
    "sierra leone": {"iso": "SL", "abbr": "SLE"},
    "singapore": {"iso": "SG", "abbr": "SGP"},
    "slovakia": {"iso": "SK", "abbr": "SVK"},
    "slovenia": {"iso": "SI", "abbr": "SVN"},
    "solomon islands": {"iso": "SB", "abbr": "SLB"},
    "somalia": {"iso": "SO", "abbr": "SOM"},
    "south africa": {"iso": "ZA", "abbr": "ZAF"},
    "south sudan": {"iso": "SS", "abbr": "SSD"},
    "spain": {"iso": "ES", "abbr": "ESP"},
    "sri lanka": {"iso": "LK", "abbr": "LKA"},
    "sudan": {"iso": "SD", "abbr": "SDN"},
    "suriname": {"iso": "SR", "abbr": "SUR"},
    "sweden": {"iso": "SE", "abbr": "SWE"},
    "switzerland": {"iso": "CH", "abbr": "CHE"},
    "syria": {"iso": "SY", "abbr": "SYR"},
    "taiwan": {"iso": "TW", "abbr": "TWN"},
    "tajikistan": {"iso": "TJ", "abbr": "TJK"},
    "tanzania": {"iso": "TZ", "abbr": "TZA"},
    "thailand": {"iso": "TH", "abbr": "THA"},
    "timor-leste": {"iso": "TL", "abbr": "TLS"},
    "togo": {"iso": "TG", "abbr": "TGO"},
    "tonga": {"iso": "TO", "abbr": "TON"},
    "trinidad and tobago": {"iso": "TT", "abbr": "TTO"},
    "tunisia": {"iso": "TN", "abbr": "TUN"},
    "turkey": {"iso": "TR", "abbr": "TUR"},
    "turkmenistan": {"iso": "TM", "abbr": "TKM"},
    "tuvalu": {"iso": "TV", "abbr": "TUV"},
    "uganda": {"iso": "UG", "abbr": "UGA"},
    "ukraine": {"iso": "UA", "abbr": "UKR"},
    "united arab emirates": {"iso": "AE", "abbr": "ARE"},
    "united kingdom": {"iso": "GB", "abbr": "GBR"},
    "united states": {"iso": "US", "abbr": "USA"},
    "uruguay": {"iso": "UY", "abbr": "URY"},
    "uzbekistan": {"iso": "UZ", "abbr": "UZB"},
    "vanuatu": {"iso": "VU", "abbr": "VUT"},
    "venezuela": {"iso": "VE", "abbr": "VEN"},
    "vietnam": {"iso": "VN", "abbr": "VNM"},
    "yemen": {"iso": "YE", "abbr": "YEM"},
    "zambia": {"iso": "ZM", "abbr": "ZMB"},
    "zimbabwe": {"iso": "ZW", "abbr": "ZWE"}
}

# Language patterns that might hint at country of origin
LANGUAGE_PATTERNS = {
    "ä": ["german", "finnish"],
    "ö": ["german", "swedish", "finnish"],
    "ü": ["german"],
    "ß": ["german"],
    "é": ["french", "spanish"],
    "è": ["french", "italian"],
    "ê": ["french"],
    "ç": ["french", "portuguese"],
    "ñ": ["spanish"],
    "ø": ["danish", "norwegian"],
    "å": ["swedish", "norwegian", "danish"],
    "æ": ["danish", "norwegian"],
}


class PradoService:
    """
    Service for PRADO document verification integration.
    Provides methods to generate PRADO URLs and integrate with AI document analysis.
    """

    def __init__(self, ai_agent: Optional['AIAgent'] = None):
        """
        Initialize the PRADO service with optional AI agent.
        """
        self.ai_agent = ai_agent
        logger.info("PRADO service initialized")

    def get_country_info(self, country_input: str) -> Optional[Dict[str, Any]]:
        """
        Get country information from input which could be a name or adjective.
        """
        if not country_input:
            return None

        key = country_input.strip().lower()
        # direct match
        if key in COUNTRY_CODES:
            info = COUNTRY_CODES[key]
            return {"name": key, "iso": info["iso"], "abbr": info["abbr"]}
        # partial
        for country, info in COUNTRY_CODES.items():
            if key in country or country in key:
                return {"name": country, "iso": info["iso"], "abbr": info["abbr"]}
        return None

    def get_document_type_code(self, doc_type: str) -> str:
        """
        Map a free‐text doc type to PRADO code, defaulting to 'B'.
        """
        if not doc_type:
            return "B"
        dt = doc_type.strip().lower()
        if dt in DOCUMENT_TYPE_CODES:
            return DOCUMENT_TYPE_CODES[dt]
        for known, code in DOCUMENT_TYPE_CODES.items():
            if known in dt or dt in known:
                return code
        return "B"

    def get_prado_url(self, country: Optional[str] = None,
                      document_type: str = "identity card") -> Dict[str, Any]:
        """
        Generate PRADO URL for the specified country and document type.
        """
        start = time.time()
        result: Dict[str, Any] = {
            "status": "error",
            "message": "",
            "url": None,
            "country_url": None,
            "document_url": None,
            "country_info": None,
            "processing_time": 0,
            "document_type": document_type
        }

        # no country => search page
        if not country:
            result.update({
                "status": "info",
                "message": "No country specified, returning base URL",
                "url": PRADO_SEARCH_URL,
                "processing_time": time.time() - start
            })
            return result

        ci = self.get_country_info(country)
        if not ci:
            result.update({
                "status": "error",
                "message": f"Unknown country: {country}",
                "processing_time": time.time() - start
            })
            return result

        result["country_info"] = ci
        country_url = PRADO_COUNTRY_URL_TEMPLATE.format(abbr=ci["abbr"])
        doc_code = self.get_document_type_code(document_type)
        document_url = PRADO_DOCUMENT_URL_TEMPLATE.format(abbr=ci["abbr"], doc_type=doc_code)

        result.update({
            "country_url": country_url,
            "document_url": document_url,
            "url": document_url,
            "status": "success",
            "message": "URL generated successfully",
            "processing_time": time.time() - start
        })
        return result

    def suggest_countries_from_ai_data(self, ai_data: Dict[str, Any]) -> List[str]:
        """
        Suggest possible countries based on AI‐extracted fields and language hints.
        """
        suggestions = set()

        def check(text: str):
            if not text:
                return
            t = text.lower()
            for c in COUNTRY_CODES:
                if c in t:
                    suggestions.add(c)

        check(ai_data.get("birth_place", ""))
        check(ai_data.get("document_issue_place", ""))

        all_text = " ".join(str(ai_data.get(f, "")) for f in
                            ["first_name", "last_name", "birth_place", "document_issue_place", "address"]).lower()
        for pat, ctrys in LANGUAGE_PATTERNS.items():
            if pat in all_text:
                suggestions.update(ctrys)

        return list(suggestions)

    async def detect_country_from_ocr(self, ocr_text: str) -> str:
        """
        Use AI agent to detect country from raw OCR text.
        """
        if not self.ai_agent:
            logger.warning("No AI agent available for country detection")
            return ""
        try:
            return await self.ai_agent.detect_document_country(ocr_text)
        except Exception as e:
            logger.error(f"Error detecting country: {e}")
            return ""

    def open_url_in_browser(self, url: str) -> bool:
        """
        Open a URL in the default web browser.
        """
        try:
            webbrowser.open(url)
            logger.info(f"Opened URL in browser: {url}")
            return True
        except Exception as e:
            logger.error(f"Error opening URL: {e}")
            return False

    async def process_document(self,
                               file: Union[str, UploadFile],
                               interactive: bool = False) -> Dict[str, Any]:
        """
        Process a document via OCR→AI→PRADO, optionally opening the URL.
        """
        if not self.ai_agent:
            return {"status": "error", "message": "No AI agent available"}

        start = time.time()
        logger.info("Starting PRADO document processing")
        result = await self.ai_agent.process_document(file)
        if result.get("status") not in ("success", "partial_success"):
            return {
                "status": "error",
                "message": result.get("message", "Document processing failed"),
                "processing_time": time.time() - start
            }

        ai_data = result.get("data", {})
        country = ai_data.get("country", "")

        # 1) AI‐detected country
        if country:
            pr = self.get_prado_url(country)
            if pr["status"] == "success" and interactive:
                self.open_url_in_browser(pr["url"])
            return {
                "status": "success",
                "message": f"Country detected: {country}",
                "country": country,
                "prado_info": pr,
                "processing_time": time.time() - start
            }

        # 2) Suggestions
        suggestions = self.suggest_countries_from_ai_data(ai_data)
        if suggestions:
            return {
                "status": "suggestions",
                "message": "Country not detected, but found suggestions",
                "suggestions": suggestions,
                "processing_time": time.time() - start
            }

        # 3) OCR fallback
        ocr_txt = result.get("ocr_text", "")
        if ocr_txt:
            detected = await self.detect_country_from_ocr(ocr_txt)
            if detected:
                pr = self.get_prado_url(detected)
                if pr["status"] == "success" and interactive:
                    self.open_url_in_browser(pr["url"])
                return {
                    "status": "success",
                    "message": f"Country detected from OCR: {detected}",
                    "country": detected,
                    "prado_info": pr,
                    "processing_time": time.time() - start
                }

        # 4) Give user base search or refer
        if interactive:
            self.open_url_in_browser(PRADO_SEARCH_URL)
        return {
            "status": "refer_to_compliance",
            "message": "Unable to determine document country, refer to compliance",
            "processing_time": time.time() - start
        }


def parse_prado_query(query: str) -> Dict[str, Any]:
    """
    Parse a natural language query to extract country and document type,
    then return the PRADO URL result along with the raw extraction.
    """
    q = query.lower()
    extracted_country = next((c for c in COUNTRY_CODES if c in q), None)
    extracted_doctype = next((d for d in DOCUMENT_TYPE_CODES if d in q), None)

    svc = PradoService()
    res = svc.get_prado_url(extracted_country, extracted_doctype or "identity card")
    res.update({
        "extracted_country": extracted_country,
        "extracted_document_type": extracted_doctype
    })
    return res


def get_prado_url(country: Optional[str] = None,
                  document_type: str = "identity card") -> Dict[str, Any]:
    """
    Quick helper to get a PRADO URL without instantiating a service.
    """
    return PradoService().get_prado_url(country, document_type)
