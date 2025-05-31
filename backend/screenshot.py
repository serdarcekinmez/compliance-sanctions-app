



import logging
import os
import base64
import re
from PIL import Image as PILImage, ImageEnhance
from io import BytesIO
from reportlab.lib.units import cm, inch

logger = logging.getLogger("ComplianceService")

async def handle_screenshot(
    screenshot: str,
    temp_dir: str,
    elements: list,
    styles: dict,
    A4: tuple,
    ReportLabImage,
    Paragraph,
    Spacer,
    heading_style
):
    """
    Process screenshot data from client-side html2canvas and add to PDF elements

    Args:
        screenshot: Screenshot data URL string from client-side html2canvas
        temp_dir: Temporary directory path for processing
        elements: List of PDF flowables to append to
        styles: ReportLab style dictionary
        A4: Tuple specifying page size (width, height)
        ReportLabImage: ReportLab Image class
        Paragraph: ReportLab Paragraph class
        Spacer: ReportLab Spacer class
        heading_style: Paragraph style for headings
    """
    if not screenshot:
        logger.warning("No screenshot provided to handler")
        return

    # Section header
    elements.append(Paragraph("Sanctions Check Results", heading_style))
    elements.append(Spacer(1, 0.3 * cm))

    # Decode and enhance image
    screenshot_path = os.path.join(temp_dir, "screenshot.png")
    try:
        logger.info(f"Processing screenshot data (length: {len(screenshot)} chars)")
        
        # FIXED: Handle the data URL properly
        if screenshot.startswith('data:image/'):
            # Extract the format and base64 data
            pattern = r'data:image/([a-zA-Z]+);base64,(.+)'
            match = re.match(pattern, screenshot)
            if not match:
                raise ValueError("Invalid data URL format")

            image_format, base64_data = match.groups()
            logger.info(f"Extracted image format: {image_format}")
            
            # Clean the base64 data (remove any whitespace or newlines)
            base64_data = base64_data.strip()
            
            # Decode the base64 data
            try:
                image_data = base64.b64decode(base64_data)
                logger.info(f"Successfully decoded base64 data: {len(image_data)} bytes")
            except Exception as decode_error:
                logger.error(f"Base64 decode error: {decode_error}")
                # Try with padding
                missing_padding = len(base64_data) % 4
                if missing_padding:
                    base64_data += '=' * (4 - missing_padding)
                    image_data = base64.b64decode(base64_data)
                    logger.info(f"Decoded with padding: {len(image_data)} bytes")
                else:
                    raise
        else:
            # If it's not a data URL, it might be raw base64 or a file path
            logger.warning("Screenshot doesn't start with 'data:image/', attempting direct decode")
            try:
                # Try to decode as base64 directly
                image_data = base64.b64decode(screenshot)
                logger.info(f"Direct base64 decode successful: {len(image_data)} bytes")
            except:
                logger.error("Screenshot is neither a data URL nor valid base64")
                raise ValueError("Invalid screenshot format")

        # Open with PIL
        img = PILImage.open(BytesIO(image_data))
        logger.info(f"Image opened successfully: {img.width}x{img.height}, mode={img.mode}")
        
        # Convert to RGB if necessary
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")
            logger.info("Converted image to RGB mode")

        # Apply subtle enhancements for better quality
        img = ImageEnhance.Sharpness(img).enhance(1.2)
        img = ImageEnhance.Contrast(img).enhance(1.1)
        
        # Save the image with high quality
        img.save(screenshot_path, format='PNG', quality=95, optimize=True)
        logger.info(f"Screenshot saved successfully: {screenshot_path} (size: {os.path.getsize(screenshot_path)} bytes)")

    except Exception as e:
        logger.error(f"Error processing screenshot: {e}", exc_info=True)
        elements.append(Paragraph(f"Error processing screenshot: {str(e)}", styles.get("Warning", styles.get("Normal", styles["Normal"]))))
        elements.append(Spacer(1, 0.5 * cm))
        return

    # Add image to PDF
    if os.path.exists(screenshot_path):
        try:
            logger.info(f"Adding screenshot to PDF from {screenshot_path}")
            
            # Create the image flowable
            img_flowable = ReportLabImage(screenshot_path)
            
            # Calculate dimensions to fit on page
            page_width = A4[0]
            page_height = A4[1]
            
            # Use 95% of page width for the image
            available_width = page_width * 0.95
            
            # Calculate proportional height
            aspect_ratio = img_flowable.imageWidth / img_flowable.imageHeight
            img_flowable.drawWidth = available_width
            img_flowable.drawHeight = available_width / aspect_ratio
            
            # Limit maximum height to prevent overflow
            max_height = 12 * inch  # Reasonable maximum height
            if img_flowable.drawHeight > max_height:
                img_flowable.drawHeight = max_height
                img_flowable.drawWidth = max_height * aspect_ratio
                logger.info(f"Image height limited to {max_height} points")
            
            # Center the image
            img_flowable.hAlign = 'CENTER'
            
            # Log final dimensions
            logger.info(f"Image dimensions in PDF: {img_flowable.drawWidth:.1f} x {img_flowable.drawHeight:.1f} points")
            
            # Add to elements
            elements.append(img_flowable)
            elements.append(Spacer(1, 0.5 * cm))
            logger.info("Screenshot added to PDF successfully")

        except Exception as img_err:
            logger.error(f"Error adding screenshot to PDF: {img_err}", exc_info=True)
            elements.append(Paragraph(f"Error displaying screenshot: {str(img_err)}", styles.get("Warning", styles.get("Normal", styles["Normal"]))))
            elements.append(Spacer(1, 0.5 * cm))
    else:
        logger.warning(f"Screenshot file not found at {screenshot_path}")
        elements.append(Paragraph("Screenshot could not be processed.", styles.get("Warning", styles.get("Normal", styles["Normal"]))))
        elements.append(Spacer(1, 0.5 * cm))