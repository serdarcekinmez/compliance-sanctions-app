




import os
import logging
import shutil
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import cm

# Import handlers
from screenshot import handle_screenshot
from pdf_doc_handler import handle_documents

logger = logging.getLogger("ComplianceService")

async def generate_pdf_report(
    temp_dir, 
    pdf_path, 
    permanent_pdf_path, 
    name, 
    surname,
    transactionNumber,
    transactionAmount,
    euroEquivalent,
    address,
    documentNumber,
    documentIssuePlace,
    telephone,
    email,
    salaryOrigin,
    transactionIntent,
    transactionNature,
    suspicious,
    agentObservations,
    docNotes,
    screenshot,
    document_files,
    ocr_fields=None
):
    """
    Generate a comprehensive PDF report with registration details, sanctions screenshot,
    document files, and OCR information.
    
    Args:
        temp_dir: Temporary directory for processing
        pdf_path: Path where the PDF will be saved temporarily
        permanent_pdf_path: Path for permanent PDF storage
        name, surname, etc.: Customer and registration data
        screenshot: Screenshot data URL from client-side html2canvas
        document_files: List of document files to include
        ocr_fields: List of fields that were populated by OCR
        
    Returns:
        Path to the generated PDF file
    """
    try:
        logger.info(f"Creating comprehensive PDF report for {name} {surname}")
        
        # Create the PDF document with proper settings
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Create styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        heading_style = styles['Heading2']
        subheading_style = styles['Heading3']
        normal_style = styles['Normal']
        
        # Add custom styles
        styles.add(ParagraphStyle(
            name='Warning',
            parent=styles['Normal'],
            textColor=colors.red,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='Success',
            parent=styles['Normal'],
            textColor=colors.green,
            fontName='Helvetica-Bold'
        ))
        
        styles.add(ParagraphStyle(
            name='Info',
            parent=styles['Normal'],
            textColor=colors.blue,
            fontName='Helvetica-Bold'
        ))
        
        # Content elements
        elements = []
        
        # Title and Date
        elements.append(Paragraph("Compliance Report", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        elements.append(Spacer(1, 0.5*cm))
        
        # Customer Information Section
        elements.append(Paragraph("Customer Information", heading_style))
        elements.append(Spacer(1, 0.3*cm))
        
        # Create a table for customer information
        customer_data = [
            ["Name", f"{name} {surname}"],
            ["Transaction Number", transactionNumber or "N/A"],
            ["Transaction Amount", transactionAmount or "N/A"],
            ["Euro Equivalent", euroEquivalent or "N/A"],
            ["Address", address or "N/A"],
            ["Document Number", documentNumber or "N/A"],
            ["Document Issue Place", documentIssuePlace or "N/A"],
            ["Telephone", telephone or "N/A"],
            ["Email", email or "N/A"],
            ["Salary Origin", salaryOrigin or "N/A"],
            ["Transaction Nature", transactionNature or "N/A"],
            ["Suspicious", "Yes" if suspicious == "Y" else "No"],
        ]
        
        # Style the customer information table
        customer_table = Table(customer_data, colWidths=[4*cm, 12*cm])
        customer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(customer_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # OCR Information if available
        if ocr_fields and len(ocr_fields) > 0:
            elements.append(Paragraph("OCR-Processed Fields", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            
            elements.append(Paragraph("The following fields were populated using OCR technology:", normal_style))
            elements.append(Spacer(1, 0.2*cm))
            
            # Create a table for OCR fields
            ocr_data = [["Field", "OCR Processed"]]
            for field in ocr_fields:
                ocr_data.append([field, "Yes"])
                
            ocr_table = Table(ocr_data, colWidths=[8*cm, 8*cm])
            ocr_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(ocr_table)
            elements.append(Spacer(1, 0.5*cm))
        
        # Transaction Intent
        if transactionIntent:
            elements.append(Paragraph("Transaction Intent", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph(transactionIntent, normal_style))
            elements.append(Spacer(1, 0.5*cm))
        
        # Agent Observations
        if agentObservations:
            elements.append(Paragraph("Agent Observations", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph(agentObservations, normal_style))
            elements.append(Spacer(1, 0.5*cm))
        
        # Warning for suspicious transactions
        if suspicious == "Y":
            elements.append(Paragraph("THIS TRANSACTION HAS BEEN FLAGGED AS SUSPICIOUS!", 
                                    styles["Warning"]))
            elements.append(Spacer(1, 0.5*cm))
        
        # Document Notes
        if docNotes:
            elements.append(Paragraph("Document Notes", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph(docNotes, normal_style))
            elements.append(Spacer(1, 0.5*cm))
        
        # Process screenshot
        if screenshot:
            logger.info(f"Processing screenshot ({len(screenshot)} bytes)")
            
            # Use the screenshot handler
            await handle_screenshot(
                screenshot, 
                temp_dir, 
                elements, 
                styles, 
                A4, 
                Image, 
                Paragraph, 
                Spacer, 
                heading_style
            )
        else:
            logger.warning("No screenshot data available")
            elements.append(Paragraph("Sanctions Check Results", heading_style))
            elements.append(Spacer(1, 0.3*cm))
            elements.append(Paragraph("No sanctions check screenshot available.", styles["Warning"]))
            elements.append(Spacer(1, 0.5*cm))
        
        # Process documents if available
        if document_files and len(document_files) > 0:
            logger.info(f"Processing {len(document_files)} document files")
            await handle_documents(
                document_files, 
                temp_dir, 
                elements, 
                styles, 
                A4, 
                Image, 
                Paragraph, 
                Spacer, 
                heading_style, 
                normal_style
            )
        
        # Add a completion footer
        elements.append(Spacer(1, 1*cm))
        elements.append(Paragraph("End of Report", styles["Success"]))
        elements.append(Paragraph(f"Generated by Compliance System on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))


        # Build the PDF
        doc.build(elements)
        logger.info(f"PDF built successfully at {pdf_path}")
        
        # Copy the generated PDF to permanent storage
        shutil.copy2(pdf_path, permanent_pdf_path)
        logger.info(f"PDF saved to permanent storage: {permanent_pdf_path}")
        
        return pdf_path
        
    except Exception as e:
        logger.error(f"Error generating PDF report: {e}", exc_info=True)
        raise e