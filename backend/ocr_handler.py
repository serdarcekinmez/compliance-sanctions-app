



#!/usr/bin/env python3
import os
import cv2
import numpy as np
import logging
import time
import easyocr
from typing import Union, Optional, List, Dict, Any
from fastapi import UploadFile

# configure logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger("ComplianceService.OCR")

# global OCR reader
OCR_READER = None
SUPPORTED_LANGUAGES = ['en', 'fr', 'es']
MAX_W, MAX_H = 2000, 2000

def get_ocr_reader():
    global OCR_READER
    if OCR_READER is None:
        OCR_READER = easyocr.Reader(SUPPORTED_LANGUAGES, gpu=False)
    return OCR_READER

async def read_image_file(file: Union[UploadFile, str]) -> Optional[bytes]:
    try:
        if isinstance(file, str):
            return open(file, 'rb').read()
        await file.seek(0)
        return await file.read()
    except Exception as e:
        logger.error(f"read_image_file error: {e}")
        return None

def preprocess(img_bytes: bytes) -> Optional[np.ndarray]:
    arr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None
    h, w = img.shape[:2]
    if w > MAX_W or h > MAX_H:
        f = min(MAX_W/w, MAX_H/h)
        img = cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
    return img

async def extract_text_with_easyocr(image_data: bytes) -> Dict[str, Any]:
    img = preprocess(image_data)
    if img is None:
        return {"text": ""}
    reader = get_ocr_reader()
    results = reader.readtext(img)
    # group by line y-coordinate
    results.sort(key=lambda x: (x[0][0][1], x[0][0][0]))
    lines, curr, last_y = [], [], None
    for box, txt, _ in results:
        y = (box[0][1] + box[2][1]) / 2
        if last_y is not None and abs(y-last_y) > 20:
            lines.append(" ".join(t for _, t in sorted(curr)))
            curr = []
        curr.append((box[0][0], txt)); last_y = y
    if curr:
        lines.append(" ".join(t for _, t in sorted(curr)))
    return {"text": "\n".join(lines)}

async def process_document(
    front_file: Union[UploadFile, str],
    back_file: Optional[Union[UploadFile, str]] = None
) -> Dict[str, Any]:
    files = [front_file] + ([back_file] if back_file else [])
    parts: List[str] = []
    for i, f in enumerate(files, 1):
        data = await read_image_file(f)
        if not data:
            continue
        res = await extract_text_with_easyocr(data)
        text = res.get("text", "").strip()
        if text:
            parts.append(f"=== PAGE {i} ===\n{text}")
    combined = "\n\n".join(parts)
    return {
        "status": "success" if combined else "error",
        "text": combined,
        "is_multi_page": len(files) > 1
    }

async def extract_identity_info(file: UploadFile) -> Dict[str, Any]:
    data = await read_image_file(file)
    if not data:
        return {"status": "error", "message": "Failed to read file"}
    ocr = await extract_text_with_easyocr(data)
    text = ocr.get("text", "")
    if not text:
        return {"status": "error", "message": "No text extracted"}
    return {
        "status": "success",
        "text": text
    }
