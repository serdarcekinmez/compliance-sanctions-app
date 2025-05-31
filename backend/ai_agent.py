




#!/usr/bin/env python3
"""ai_agent.py
Enhanced AI agent for Compliance Demo.
Includes robust handling of malformed JSON coming back from the LLM when
interpreting OCR text for ID documents.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict

import httpx

# Import COUNTRY_CODES lazily inside functions to avoid circular imports

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("ComplianceService.AI")


class AIConfig:
    """Configuration values for the local Ollama LLM."""

    OLLAMA_HOST = "http://localhost:11434"
    MODEL = "mistral:latest"
    API_URL = f"{OLLAMA_HOST}/api/generate"
    TIMEOUT = 120.0
    TEMPERATURE = 0.1

    # Prompt expecting a *pure JSON* answer. We reinforce the formatting rules.
    IDENTITY_PROMPT = (
        """You are given raw OCR text from an ID document.\n"
        "Extract **exactly** these fields and return only a minified JSON object (no extra text):\n\n"
        "- document_number\n"
        "- first_name\n"
        "- last_name\n"
        "- birth_date    (YYYY-MM-DD if possible)\n"
        "- birth_place\n"
        "- document_issue_date\n"
        "- document_issue_place\n"
        "- expiry_date\n"
        "- address\n"
        "- country\n\n"
        "OCR text:\n{ocr_text}\n\n"
        "JSON:"""
    )


class AIAgent:
    """Wrapper around Ollama for the Compliance project."""

    def __init__(self, config: AIConfig | None = None):
        self.config = config or AIConfig()

    # ---------------------------------------------------------------------
    # Core helper to query Ollama
    # ---------------------------------------------------------------------
    async def query_ollama(self, prompt: str) -> str:
        """Send a prompt to Ollama and return the *raw* response text."""
        async with httpx.AsyncClient(timeout=self.config.TIMEOUT) as client:
            payload = {
                "model": self.config.MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.config.TEMPERATURE,
                    "top_p": 0.9,
                    "num_predict": 500,
                },
            }
            resp = await client.post(self.config.API_URL, json=payload)
            if resp.status_code != 200:
                logger.error("Ollama error %s", resp.status_code)
                return ""
            return resp.json().get("response", "")

    # ------------------------------------------------------------------
    # Enhanced OCR interpretation
    # ------------------------------------------------------------------
    async def interpret_identity_document(self, ocr_text: str) -> Dict[str, Any]:
        """Interpret the free‑form OCR dump of an ID document.

        The LLM is asked to produce *valid JSON*. Reality is messy, though, so we:
        1. Ask for JSON only and scan the response for the first {{ ... }} block.
        2. Attempt to load it via ``json.loads``.
        3. If parsing fails, run a *repair* pass that fixes the three classics:
           – un‑quoted keys, single quotes, and trailing commas.
        4. Return either the parsed dict **or** a structured error payload so the
           UI can show a nuanced warning (instead of crashing).
        """

        # ------------------------------------------------------------------
        # Sanity check on input
        # ------------------------------------------------------------------
        if not ocr_text or len(ocr_text.strip()) < 5:
            return {"error": "No OCR text to interpret"}

        prompt = self.config.IDENTITY_PROMPT.format(ocr_text=ocr_text)
        ai_resp = await self.query_ollama(prompt)
        logger.debug("AI raw output (first 250 chars): %s", ai_resp[:250])

        if not ai_resp:
            return {"error": "Empty response from AI"}

        # ------------------------------------------------------------------
        # Try to locate the first JSON blob in the response.
        # We purposefully use a *greedy* regex so nested braces inside strings
        # do not prematurely terminate the match.
        # ------------------------------------------------------------------
        match = re.search(r"\{.*\}", ai_resp, re.DOTALL)
        if not match:
            return {
                "error": "No JSON found in AI response",
                "raw_response": ai_resp[:200],
            }

        json_str: str = match.group(0)

        # ------------------------------------------------------------------
        # Helper: clean common malformations
        # ------------------------------------------------------------------
        def _clean_json(s: str) -> str:
            """Fix the three usual JSON sins: single quotes, un‑quoted keys, trailing commas."""
            # 1. Turn single quotes into double quotes *only* when they appear as
            #    string delimiters, avoiding contractions inside values.
            s = re.sub(r"'([^']*?)'", r'"\1"', s)
            # 2. Quote un‑quoted keys (identifier followed by colon).
            s = re.sub(r"(?<=\{|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", r'"\1":', s)
            # 3. Drop dangling commas before }} or ]].
            s = re.sub(r",(\s*[}\]])", r"\1", s)
            return s

        # ------------------------------------------------------------------
        # Try the raw JSON first, then the cleaned version.
        # ------------------------------------------------------------------
        for candidate in (json_str, _clean_json(json_str)):
            try:
                parsed = json.loads(candidate)
                # Success! Optionally normalise values here (strip extra spaces).
                return parsed  # Early return on first successful parse
            except json.JSONDecodeError as exc:
                last_error = exc  # keep for the final structured error

        # ------------------------------------------------------------------
        # Still here? Both parses failed – return structured diagnostics.
        # ------------------------------------------------------------------
        return {
            "error": f"Failed to parse JSON after cleanup: {last_error}",
            "raw_response": ai_resp[:200],  # Enough for quick inspection/log
            "suggested_action": "manual_review",
        }

    # ------------------------------------------------------------------
    # Country / doc‑type extraction (unchanged)
    # ------------------------------------------------------------------
    async def extract_country_and_doc_type(self, query: str) -> Dict[str, Any]:
        """Use LLM to intelligently extract country and document type from natural language."""
        # Import here to avoid circular imports
        from prado import COUNTRY_CODES

        # Create a list of valid countries for the prompt
        valid_countries = list(COUNTRY_CODES.keys())

        prompt = f"""You are a multilingual assistant that identifies countries and document types from user queries in ANY language.

Valid countries (ALWAYS return these exact English names in lowercase):
{', '.join(valid_countries[:30])}... (and more)

Valid document types:
- passport
- id card / identity card
- driving license
- residence permit
- visa
- travel document

User query: \"{query}\"

IMPORTANT: Translate country names to English before responding!
Return ONLY a JSON object (country MUST be the English name in lowercase):
{{"country": "english country name in lowercase or null", "document_type": "document type or identity card"}}

JSON:"""

        try:
            response = await self.query_ollama(prompt)
            match = re.search(r"\{.*\}", response, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return {
                    "status": "success",
                    "country": data.get("country"),
                    "document_type": data.get("document_type", "identity card"),
                }
        except Exception as exc:  # pragma: no cover – broad catch OK at boundary
            logger.error("Error extracting country/doc type: %s", exc)

        return {
            "status": "error",
            "message": "Could not extract country/document information",
        }

    # ------------------------------------------------------------------
    # High‑level chat handler (unchanged)
    # ------------------------------------------------------------------
    async def answer_query(self, query: str, context: str | None = None) -> Dict[str, Any]:
        """Answer user queries with optional PRADO detection and URL preparation."""
        query_lower = query.lower()

        # Import here to avoid circular imports
        from prado import COUNTRY_CODES, DOCUMENT_TYPE_CODES, get_prado_url

        # Heuristic: does the user *seem* to request PRADO verification?
        prado_keywords = [
            "prado",
            "verify",
            "document",
            "security",
            "show me",
            "id card",
            "passport",
            "guide me",
        ]
        is_prado_query = any(keyword in query_lower for keyword in prado_keywords)

        if is_prado_query:
            extraction_result = await self.extract_country_and_doc_type(query)

            if extraction_result["status"] == "success" and extraction_result.get("country"):
                found_country = extraction_result["country"]
                found_doc_type = extraction_result.get("document_type", "identity card")

                # Check the country exists in our mapping (case‑insensitive)
                if found_country.lower() in COUNTRY_CODES:
                    prado_result = get_prado_url(found_country.lower(), found_doc_type)

                    if prado_result["status"] == "success":
                        return {
                            "text": (
                                f"Of course! I found the {found_country.title()} {found_doc_type.title()} information. "
                                "Please click the PRADO button to open the verification page."
                            ),
                            "pradoContext": {
                                "suggestPrado": True,
                                "country": found_country.lower(),
                                "document_type": found_doc_type,
                                "url": prado_result["url"],
                                "country_info": prado_result.get("country_info"),
                            },
                        }

                    # URL generation failed – encourage manual click
                    return {
                        "text": (
                            f"I found your request for {found_country} {found_doc_type}, but I couldn't generate the PRADO URL. "
                            "Please try clicking the PRADO button anyway."
                        ),
                        "pradoContext": {
                            "suggestPrado": True,
                            "country": found_country.lower(),
                            "document_type": found_doc_type,
                        },
                    }

                # Unknown country
                return {
                    "text": (
                        f"I understood you're looking for {found_country} documents, but that country isn't in my PRADO database. "
                        "Could you please verify the country name?"
                    ),
                    "pradoContext": None,
                }

            # Could not extract any country – ask follow‑up
            return {
                "text": (
                    "I can help you with PRADO document verification. Please specify the country "
                    "(e.g., 'Belgium ID card', 'French passport'). I understand different languages and can handle typos!"
                ),
                "pradoContext": None,
            }

        # --------------------------------------------------------------
        # Regular chat query – hand off to Ollama
        # --------------------------------------------------------------
        try:
            prompt = (
                "You are a helpful compliance assistant. Answer this question clearly and concisely:\n\n"
                f"Question: {query}\n"
                f"Context: {context if context else 'No additional context'}\n\n"
                "Answer:"
            )

            response = await self.query_ollama(prompt)
            return {
                "text": response if response else "I'm sorry, I couldn't generate a response.",
                "pradoContext": None,
            }
        except Exception as exc:  # pragma: no cover – broad catch OK at boundary
            logger.error("Chat handler error: %s", exc)
            return {
                "text": f"I encountered an error: {exc}",
                "pradoContext": None,
            }

    # ------------------------------------------------------------------
    # Helper to expose bare country/doc extraction
    # ------------------------------------------------------------------
    async def prepare_prado_url(self, query: str) -> Dict[str, Any]:
        """Prepare PRADO URL information based on user query."""
        return await self.extract_country_and_doc_type(query)
