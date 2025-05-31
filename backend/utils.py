





import base64
import re
import logging
from io import BytesIO
from PIL import Image

logger = logging.getLogger("ComplianceService")

def process_data_url(data_url_str, output_path):
    """
    Process a data URL string, extract the image data, and save it to the output path.
    
    Args:
        data_url_str (str): The data URL string, starting with "data:image/"
        output_path (str): Path where to save the extracted image
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Handle both string and bytes input
        if isinstance(data_url_str, bytes):
            data_url_str = data_url_str.decode('utf-8')
        
        # Validate it's a data URL
        if not data_url_str.startswith('data:image/'):
            logger.error("Invalid data URL format - doesn't start with 'data:image/'")
            return False
        
        # Extract the content type and base64 data
        match = re.match(r'data:image/([a-zA-Z]+);base64,(.*)', data_url_str)
        if not match:
            logger.error("Invalid data URL format - couldn't extract content type and data")
            return False
        
        img_format, base64_data = match.groups()
        
        # Decode the base64 data
        img_data = base64.b64decode(base64_data)
        
        # Open the image using PIL
        img = Image.open(BytesIO(img_data))
        
        # Save the image
        img.save(output_path)
        logger.info(f"Successfully saved image to {output_path}")
        return True
    
    except Exception as e:
        logger.error(f"Error processing data URL: {e}")
        return False