
import os
import re
import json
import logging
from typing import List, Dict, Optional, Tuple, Union
import requests
from io import BytesIO
import tempfile
import datetime
import hashlib

# PDF processing
try:
    import PyPDF2
    from pdfminer.high_level import extract_text as extract_pdf_text
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    
# Document processing
try:
    import docx
    DOCX_SUPPORT = True
except ImportError:
    DOCX_SUPPORT = False
    
# Image processing
try:
    from PIL import Image
    import pytesseract
    OCR_SUPPORT = True
except ImportError:
    OCR_SUPPORT = False

logger = logging.getLogger(__name__)

class DocumentParser:
    """Parser for extracting content from various document formats"""
    
    def __init__(self):
        self.supported_formats = {
            'pdf': PDF_SUPPORT,
            'docx': DOCX_SUPPORT,
            'image_ocr': OCR_SUPPORT
        }
        self.cache_dir = "data/document_cache"
        os.makedirs(self.cache_dir, exist_ok=True)
        
    def parse_document(self, file_path_or_url: str) -> Dict:
        """
        Parse document from file path or URL
        
        Args:
            file_path_or_url: Local file path or remote URL to document
            
        Returns:
            Dict with parsed content and metadata
        """
        try:
            # Check if this is a URL or file path
            is_url = file_path_or_url.startswith(('http://', 'https://'))
            
            # Get file data
            if is_url:
                file_data, file_name = self._download_file(file_path_or_url)
                if not file_data:
                    return {'error': 'Failed to download file'}
            else:
                file_name = os.path.basename(file_path_or_url)
                try:
                    with open(file_path_or_url, 'rb') as f:
                        file_data = f.read()
                except Exception as e:
                    logger.error(f"Error reading local file: {str(e)}")
                    return {'error': f'Failed to read file: {str(e)}'}
            
            # Determine file type
            file_ext = os.path.splitext(file_name)[1].lower()
            
            # Parse based on file type
            if file_ext == '.pdf' and self.supported_formats['pdf']:
                return self._parse_pdf(file_data, file_name)
            elif file_ext == '.docx' and self.supported_formats['docx']:
                return self._parse_docx(file_data, file_name)
            elif file_ext in ['.jpg', '.jpeg', '.png'] and self.supported_formats['image_ocr']:
                return self._parse_image(file_data, file_name)
            else:
                return {'error': f'Unsupported file format: {file_ext}'}
                
        except Exception as e:
            logger.error(f"Error parsing document: {str(e)}")
            return {'error': f'Failed to parse document: {str(e)}'}
            
    def _download_file(self, url: str) -> Tuple[Optional[bytes], str]:
        """Download file from URL"""
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Get filename from URL or headers
            if 'Content-Disposition' in response.headers:
                filename = re.findall('filename="(.+)"', response.headers['Content-Disposition'])
                if filename:
                    return response.content, filename[0]
            
            # Fallback to URL path
            file_name = url.split('/')[-1].split('?')[0] or 'downloaded_file'
            return response.content, file_name
            
        except Exception as e:
            logger.error(f"Error downloading file: {str(e)}")
            return None, ""
            
    def _get_cache_path(self, file_data: bytes, file_name: str) -> str:
        """Generate cache path for file"""
        # Generate hash from file data
        file_hash = hashlib.md5(file_data).hexdigest()
        
        # Get extension
        ext = os.path.splitext(file_name)[1]
        
        # Create cache filename
        cache_file = f"{file_hash}{ext}"
        return os.path.join(self.cache_dir, cache_file)
        
    def _parse_pdf(self, file_data: bytes, file_name: str) -> Dict:
        """Parse PDF document"""
        if not PDF_SUPPORT:
            return {'error': 'PDF parsing not supported'}
            
        try:
            # Create cache path and save file
            cache_path = self._get_cache_path(file_data, file_name)
            
            # Check cache
            if os.path.exists(f"{cache_path}.json"):
                with open(f"{cache_path}.json", 'r') as f:
                    return json.load(f)
            
            # Save file for processing
            with open(cache_path, 'wb') as f:
                f.write(file_data)
                
            # Extract metadata with PyPDF2
            metadata = {}
            try:
                with open(cache_path, 'rb') as f:
                    pdf = PyPDF2.PdfReader(f)
                    metadata = {
                        'pages': len(pdf.pages),
                        'title': pdf.metadata.get('/Title', ''),
                        'author': pdf.metadata.get('/Author', ''),
                        'subject': pdf.metadata.get('/Subject', ''),
                        'creator': pdf.metadata.get('/Creator', ''),
                        'producer': pdf.metadata.get('/Producer', '')
                    }
            except Exception as e:
                logger.error(f"Error extracting PDF metadata: {str(e)}")
                
            # Extract text with pdfminer
            text = ""
            try:
                text = extract_pdf_text(cache_path)
            except Exception as e:
                logger.error(f"Error extracting PDF text with pdfminer: {str(e)}")
                
                # Fallback to PyPDF2
                try:
                    with open(cache_path, 'rb') as f:
                        pdf = PyPDF2.PdfReader(f)
                        text = ""
                        for page in pdf.pages:
                            text += page.extract_text() + "\n\n"
                except Exception as e2:
                    logger.error(f"Error extracting PDF text with PyPDF2: {str(e2)}")
                    
            # Extract structure if possible (TOC, etc.)
            structure = {"sections": []}
            
            # Prepare result
            result = {
                'content': text,
                'metadata': metadata,
                'structure': structure,
                'file_name': file_name,
                'file_type': 'pdf',
                'parsed_at': datetime.datetime.now().isoformat()
            }
            
            # Save to cache
            with open(f"{cache_path}.json", 'w') as f:
                json.dump(result, f)
                
            return result
            
        except Exception as e:
            logger.error(f"Error parsing PDF: {str(e)}")
            return {'error': f'Failed to parse PDF: {str(e)}'}
            
    def _parse_docx(self, file_data: bytes, file_name: str) -> Dict:
        """Parse DOCX document"""
        if not DOCX_SUPPORT:
            return {'error': 'DOCX parsing not supported'}
            
        try:
            # Create cache path
            cache_path = self._get_cache_path(file_data, file_name)
            
            # Check cache
            if os.path.exists(f"{cache_path}.json"):
                with open(f"{cache_path}.json", 'r') as f:
                    return json.load(f)
            
            # Save file for processing
            with open(cache_path, 'wb') as f:
                f.write(file_data)
                
            # Extract with python-docx
            doc = docx.Document(cache_path)
            
            # Extract metadata
            metadata = {
                'title': doc.core_properties.title or '',
                'author': doc.core_properties.author or '',
                'created': doc.core_properties.created.isoformat() if doc.core_properties.created else '',
                'modified': doc.core_properties.modified.isoformat() if doc.core_properties.modified else '',
                'last_modified_by': doc.core_properties.last_modified_by or ''
            }
            
            # Extract text
            paragraphs = []
            for para in doc.paragraphs:
                if para.text.strip():
                    paragraphs.append(para.text.strip())
                    
            # Extract structure (headings)
            structure = {"sections": []}
            
            # Prepare result
            result = {
                'content': '\n\n'.join(paragraphs),
                'metadata': metadata,
                'structure': structure,
                'file_name': file_name,
                'file_type': 'docx',
                'parsed_at': datetime.datetime.now().isoformat()
            }
            
            # Save to cache
            with open(f"{cache_path}.json", 'w') as f:
                json.dump(result, f)
                
            return result
            
        except Exception as e:
            logger.error(f"Error parsing DOCX: {str(e)}")
            return {'error': f'Failed to parse DOCX: {str(e)}'}
            
    def _parse_image(self, file_data: bytes, file_name: str) -> Dict:
        """Parse image using OCR"""
        if not OCR_SUPPORT:
            return {'error': 'Image OCR not supported'}
            
        try:
            # Create cache path
            cache_path = self._get_cache_path(file_data, file_name)
            
            # Check cache
            if os.path.exists(f"{cache_path}.json"):
                with open(f"{cache_path}.json", 'r') as f:
                    return json.load(f)
            
            # Save file for processing
            with open(cache_path, 'wb') as f:
                f.write(file_data)
                
            # Open image
            image = Image.open(cache_path)
            
            # Extract metadata
            metadata = {
                'format': image.format,
                'size': f"{image.width}x{image.height}",
                'mode': image.mode
            }
            
            # Extract text with OCR
            text = pytesseract.image_to_string(image)
            
            # Prepare result
            result = {
                'content': text,
                'metadata': metadata,
                'file_name': file_name,
                'file_type': 'image',
                'parsed_at': datetime.datetime.now().isoformat()
            }
            
            # Save to cache
            with open(f"{cache_path}.json", 'w') as f:
                json.dump(result, f)
                
            return result
            
        except Exception as e:
            logger.error(f"Error parsing image: {str(e)}")
            return {'error': f'Failed to parse image: {str(e)}'}
