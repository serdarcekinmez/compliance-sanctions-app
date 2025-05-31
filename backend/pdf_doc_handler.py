



# pdf_doc_handler.py
# Fixed version to prevent document cropping in PDF

import logging
import os
import asyncio
import shutil
from utils import process_data_url
from reportlab.lib.units import cm, inch
from reportlab.platypus import PageBreak, Paragraph
from PIL import Image as PILImage

logger = logging.getLogger("ComplianceService")


async def handle_documents(document_files, temp_dir, elements, styles, A4, Image, Paragraph, Spacer, heading_style, normal_style):
    """
    Process document files and add them to the PDF elements without cropping.
    
    Args:
        document_files: List of uploaded document files
        temp_dir: Temporary directory to save files
        elements: PDF elements list to append to
        styles: ReportLab styles
        A4: Page size constant (width, height in points)
        Image, Paragraph, Spacer: ReportLab classes
        heading_style: Style for headings
        normal_style: Style for normal text
        
    Returns:
        None - modifies the elements list in-place
    """
    if not document_files:
        logger.info("No document files provided")
        return
        
    elements.append(Paragraph("Uploaded Documents", heading_style))
    elements.append(Spacer(1, 0.3*cm))
    
    # Get page dimensions
    page_width = A4[0]
    page_height = A4[1]
    
    # Define margins (in points, 1 inch = 72 points)
    left_margin = 2*cm
    right_margin = 2*cm
    top_margin = 2*cm
    bottom_margin = 2*cm
    
    # Calculate available space
    available_width = page_width - left_margin - right_margin
    available_height = page_height - top_margin - bottom_margin - 100  # Leave space for header/footer
    
    for i, doc_file in enumerate(document_files):
        if not doc_file:
            logger.warning(f"Empty document entry at index {i}")
            continue
            
        # Handle string paths
        if isinstance(doc_file, str):
            logger.info(f"Processing document path {i}: {doc_file}")
            if os.path.exists(doc_file) and os.path.isfile(doc_file):
                doc_filename = os.path.basename(doc_file)
                file_ext = os.path.splitext(doc_filename)[1].lower()
                doc_path = os.path.join(temp_dir, f"document_{i}{file_ext}")
                
                try:
                    shutil.copy2(doc_file, doc_path)
                    logger.info(f"Copied document file from {doc_file} to {doc_path}")
                    
                    # Add document title
                    elements.append(Paragraph(f"Document {i+1}: {doc_filename}", normal_style))
                    elements.append(Spacer(1, 0.2*cm))
                    
                    # Process the image
                    add_image_to_pdf(doc_path, elements, Image, Spacer, available_width, available_height, styles)
                    
                except Exception as e:
                    logger.error(f"Error processing document path {i}: {e}")
                    elements.append(Paragraph(f"Error processing document {i+1}: {str(e)}", styles["Warning"]))
                    elements.append(Spacer(1, 0.3*cm))
            else:
                logger.error(f"Document file path does not exist: {doc_file}")
                elements.append(Paragraph(f"Document {i+1}: File not found - {doc_file}", styles["Warning"]))
                elements.append(Spacer(1, 0.3*cm))
            continue
            
        # Handle file-like objects
        try:
            logger.info(f"Processing uploaded document {i}: {getattr(doc_file, 'filename', 'Unknown')}")
            
            filename = getattr(doc_file, 'filename', f'document_{i}')
            file_ext = os.path.splitext(filename)[1].lower()
            if not file_ext:
                file_ext = '.png'
                
            doc_path = os.path.join(temp_dir, f"document_{i}{file_ext}")
            
            # Read and save the file
            if hasattr(doc_file, "seek") and callable(doc_file.seek):
                doc_file.seek(0)
                
            if hasattr(doc_file, "read") and callable(doc_file.read):
                if asyncio.iscoroutinefunction(doc_file.read):
                    doc_content = await doc_file.read()
                else:
                    doc_content = doc_file.read()
            else:
                doc_content = getattr(doc_file, "file", None)
                if not doc_content:
                    raise Exception(f"Could not read content from document {i}")
                    
            logger.info(f"Read {len(doc_content) if doc_content else 0} bytes from document {i}")
            
            # Save the content
            if doc_content:
                try:
                    content_str = doc_content.decode('utf-8') if isinstance(doc_content, bytes) else doc_content
                    if content_str.startswith('data:image/'):
                        logger.info(f"Processing data URL for document {i}")
                        success = process_data_url(content_str, doc_path)
                        if not success:
                            raise Exception(f"Failed to process data URL for document {i}")
                    else:
                        logger.info(f"Saving document {i} as regular file")
                        with open(doc_path, "wb") as f:
                            f.write(doc_content if isinstance(doc_content, bytes) else doc_content.encode('utf-8'))
                except (UnicodeDecodeError, AttributeError):
                    logger.info(f"Saving document {i} as binary data")
                    with open(doc_path, "wb") as f:
                        f.write(doc_content)
                
                # Add to PDF if file exists
                if os.path.exists(doc_path) and os.path.getsize(doc_path) > 0:
                    logger.info(f"Adding document {i} to PDF: {doc_path}")
                    
                    # Add document title
                    elements.append(Paragraph(f"Document {i+1}: {filename}", normal_style))
                    elements.append(Spacer(1, 0.2*cm))
                    
                    # Process the image
                    add_image_to_pdf(doc_path, elements, Image, Spacer, available_width, available_height, styles)
                    
                else:
                    raise Exception(f"Document file {i} is empty or doesn't exist")
                    
        except Exception as e:
            logger.error(f"Error processing document {i}: {e}")
            elements.append(Paragraph(f"Error processing document {i+1}: {str(e)}", styles["Warning"]))
            elements.append(Spacer(1, 0.3*cm))


def add_image_to_pdf(image_path, elements, Image, Spacer, available_width, available_height, styles):
    """
    Add an image to the PDF with proper scaling to prevent cropping.
    
    Args:
        image_path: Path to the image file
        elements: PDF elements list
        Image: ReportLab Image class
        Spacer: ReportLab Spacer class
        available_width: Available width on the page
        available_height: Available height on the page
        styles: ReportLab styles
    """
    try:
        # Open with PIL to get dimensions
        pil_img = PILImage.open(image_path)
        img_width, img_height = pil_img.size
        logger.info(f"Original image dimensions: {img_width}x{img_height}")
        
        # Calculate aspect ratio
        aspect_ratio = img_width / img_height
        
        # Calculate scaling to fit within available space while maintaining aspect ratio
        # Try width first
        scale_by_width = available_width / img_width
        new_height_by_width = img_height * scale_by_width
        
        # Check if height fits
        if new_height_by_width <= available_height:
            # Width-based scaling works
            final_width = available_width
            final_height = new_height_by_width
        else:
            # Need to scale by height instead
            scale_by_height = available_height / img_height
            final_width = img_width * scale_by_height
            final_height = available_height
        
        # Create ReportLab image with calculated dimensions
        img = Image(image_path)
        img.drawWidth = final_width
        img.drawHeight = final_height
        
        # Center the image horizontally
        img.hAlign = 'CENTER'
        
        logger.info(f"Image scaled to: {final_width:.1f}x{final_height:.1f} points")
        
        # Check if image needs to be on a new page
        # This is a simplified check - in production you might want more sophisticated logic
        if final_height > available_height * 0.7:  # If image takes more than 70% of page height
            logger.info("Large image detected, may span pages")
        
        # Add the image
        elements.append(img)
        elements.append(Spacer(1, 0.5*cm))
        
        # Close the PIL image
        pil_img.close()
        
        logger.info(f"Successfully added image to PDF")
        
    except Exception as img_error:
        logger.error(f"Error adding image to PDF: {img_error}")
        elements.append(Paragraph(f"Error displaying image: {str(img_error)}", styles.get("Warning", styles["Normal"])))
        elements.append(Spacer(1, 0.5*cm))