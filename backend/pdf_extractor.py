import tempfile
import PyPDF2
from fastapi import UploadFile
import os
import shutil

def extract_text_from_pdf(upload_file: UploadFile) -> str:
    """Extracts text from an uploaded PDF file."""
    text_content = ""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        shutil.copyfileobj(upload_file.file, temp_pdf)
        temp_file_path = temp_pdf.name

    try:
        with open(temp_file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_content += extracted + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    finally:
        upload_file.file.seek(0)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

    return text_content.strip()
