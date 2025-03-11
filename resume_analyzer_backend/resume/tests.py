from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from resume.models import Resume
from resume.utils import extract_text_from_pdf, extract_text_from_docx
from io import BytesIO
from docx import Document
from PyPDF2 import PdfWriter

# Helper functions to generate valid test files
def create_dummy_docx():
    doc = Document()
    doc.add_paragraph("Test DOCX Content")
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return SimpleUploadedFile("test_resume.docx", buffer.read(), content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")

def create_dummy_pdf():
    buffer = BytesIO()
    pdf_writer = PdfWriter()
    pdf_writer.add_blank_page(width=200, height=200)
    pdf_writer.write(buffer)
    buffer.seek(0)
    return SimpleUploadedFile("test_resume.pdf", buffer.read(), content_type="application/pdf")

class ResumeUploadTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_pdf_text_extraction(self):
        pdf_file = create_dummy_pdf()
        resume = Resume.objects.create(resume_file=pdf_file)
        extracted_text = extract_text_from_pdf(resume.resume_file.path)

        self.assertIsInstance(extracted_text, str)
        self.assertGreater(len(extracted_text), 0)

    def test_docx_text_extraction(self):
        docx_file = create_dummy_docx()
        resume = Resume.objects.create(resume_file=docx_file)
        extracted_text = extract_text_from_docx(resume.resume_file.path)

        self.assertIsInstance(extracted_text, str)
        self.assertGreater(len(extracted_text), 0)

    def test_invalid_file_upload(self):
    # Create a dummy text file (invalid format)
        txt_file = SimpleUploadedFile("test_resume.txt", b"Invalid file", content_type="text/plain")
    
    # ✅ Expect 400 Bad Request for invalid formats
        response = self.client.post(reverse("resume-upload"), {"resume_file": txt_file}, format="multipart")
    
        self.assertEqual(response.status_code, 400)  
        self.assertIn("Invalid file format", response.json()["error"])  # ✅ Check error message




    def test_resume_upload_api(self):
        pdf_file = create_dummy_pdf()
        response = self.client.post(reverse("resume-upload"), {"resume_file": pdf_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("resume_file", response.data)

    def test_resume_list_api(self):
        response = self.client.get(reverse("resume-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
