import io
import os
import re
import docx
import pdfplumber
import PyPDF2
import pytesseract
import spacy
from pdf2image import convert_from_path
from PIL import Image
from sentence_transformers import SentenceTransformer, util

# ✅ Load NLP & BERT models
nlp = spacy.load("en_core_web_sm")
bert_model = SentenceTransformer("all-MiniLM-L6-v2")

# ✅ Extract text from PDFs (with OCR support)
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        # ✅ Try pdfplumber (best for text-based PDFs)
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                extracted_text = page.extract_text()
                if extracted_text:
                    text += extracted_text + "\n"

        # ✅ Try PyPDF2 if pdfplumber fails
        if not text.strip():
            with open(pdf_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text() or ""

        # ✅ If still no text, use OCR (for scanned PDFs)
        if not text.strip():
            print("⚠️ No text extracted, attempting OCR...")
            text = extract_text_with_ocr(pdf_path)

    except Exception as e:
        print(f"❌ Error reading PDF: {e}")

    return text.strip() if text else "❌ Error extracting text"




# ✅ OCR Function for Scanned PDFs
import pdf2image
import pytesseract

# ✅ Explicitly set the Poppler path
POPPLER_PATH = r"C:\Release-23.11.0-0\poppler-23.11.0\Library\bin"

def extract_text_with_ocr(pdf_path):
    """Extracts text from scanned PDFs using OCR."""
    text = ""
    try:
        # ✅ Force `pdf2image` to use the correct Poppler path
        images = pdf2image.convert_from_path(pdf_path, poppler_path=POPPLER_PATH)
        
        for image in images:
            text += pytesseract.image_to_string(image) + "\n"
        
        print("✅ OCR successful!")

    except Exception as e:
        print(f"❌ OCR failed: {e}")
    
    return text.strip()




# ✅ Extract text from DOCX (including tables & OCR for images)
def extract_text_from_docx(docx_path):
    """Extracts text from a DOCX file, including tables & images (via OCR)."""
    try:
        doc = docx.Document(docx_path)
        text = []

        # ✅ Extract normal paragraph text
        for para in doc.paragraphs:
            text.append(para.text)

        # ✅ Extract table text
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells]
                text.append(" | ".join(row_text))  # Format table row as text

        full_text = "\n".join(text)

        # ✅ If no text found, try OCR on images in DOCX
        if not full_text.strip():
            print("⚠️ No text found, trying OCR on embedded images...")
            full_text = extract_text_from_docx_images(docx_path)

        return full_text if full_text.strip() else "❌ No extractable text found."

    except Exception as e:
        print(f"❌ Error reading DOCX: {e}")
        return "❌ Error extracting text."

# ✅ OCR function for extracting text from images inside DOCX
def extract_text_from_docx_images(docx_path):
    try:
        doc = docx.Document(docx_path)
        text = []

        for rel in doc.part.rels:
            if "image" in doc.part.rels[rel].target_ref:
                image_part = doc.part.rels[rel].target_part
                image_bytes = io.BytesIO(image_part.blob)

                # Convert image to text using OCR
                img = Image.open(image_bytes)
                extracted_text = pytesseract.image_to_string(img)
                text.append(extracted_text)

        return "\n".join(text) if text else "❌ No images found for OCR."

    except Exception as e:
        print(f"❌ OCR extraction failed: {e}")
        return "❌ OCR failed."

# ✅ Detect file type and extract text
def extract_text(file_path):
    """Extracts text from a resume file (PDF or DOCX)."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    else:
        return "❌ Unsupported file format"

# ✅ Extract email and phone numbers from extracted text
def extract_email_and_phone(text):
    """Extracts email and phone number from resume text using regex."""

    print("🔍 Extracting from text:\n", text[:1000])  # ✅ Debugging extracted text

    # ✅ Improved Email Regex (Handles multiple domain types)
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}"
    email_matches = re.findall(email_pattern, text, re.IGNORECASE)
    email = email_matches[0] if email_matches else None

    # ✅ Improved Phone Number Regex (Handles various international & local formats)
    phone_pattern = r"(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?(\d{3,4}[-.\s]?\d{4})"

    phone_matches = re.findall(phone_pattern, text)

    # ✅ Extract Full Phone Number
    phone_number = None
    if phone_matches:
        phone_number = "".join(phone_matches[0]).replace(" ", "").replace("-", "").replace(".", "").replace("(", "").replace(")", "")

    print(f"📧 Extracted Email: {email}")
    print(f"📞 Extracted Phone: {phone_number}")

    return email, phone_number

# ✅ BERT-based similarity matching
def bert_match_keywords(resume_text, job_text):
    embeddings = bert_model.encode([resume_text, job_text], convert_to_tensor=True)
    similarity_score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
    return round(similarity_score * 100, 2)

# ✅ Multi-Factor ATS Scoring Function
def compute_ats_score(resume_text, job_data):
    """Compute ATS Score based on multiple job criteria."""
    scores = {}

    # Match each factor using BERT similarity
    scores["job_title"] = bert_match_keywords(resume_text, job_data["job_title"])
    scores["job_description"] = bert_match_keywords(resume_text, job_data["job_description"])
    scores["required_skills"] = bert_match_keywords(resume_text, " ".join(job_data["required_skills"]))
    scores["preferred_qualifications"] = bert_match_keywords(resume_text, " ".join(job_data["preferred_qualifications"]))
    scores["responsibilities"] = bert_match_keywords(resume_text, " ".join(job_data["responsibilities"]))

    # Weighted Scoring System
    weights = {
        "job_title": 20,
        "job_description": 30,
        "required_skills": 25,
        "preferred_qualifications": 10,
        "responsibilities": 15,
    }

    final_ats_score = sum(scores[key] * weights[key] / 100 for key in scores)

    return {"scores": scores, "final_ats_score": round(final_ats_score, 2)}







# ===============================================================================================


# import PyPDF2
# import pdfplumber
# import docx
# import os
# from sentence_transformers import SentenceTransformer, util
# import spacy
# import re

# def extract_text_from_pdf(pdf_path):
#     text = ""
#     try:
#         with pdfplumber.open(pdf_path) as pdf:
#             for page in pdf.pages:
#                 extracted_text = page.extract_text()
#                 if extracted_text:
#                     text += extracted_text + "\n"
        
#         # Fallback to PyPDF2 if pdfplumber fails
#         if not text.strip():
#             with open(pdf_path, "rb") as file:
#                 reader = PyPDF2.PdfReader(file)
#                 for page in reader.pages:
#                     text += page.extract_text() or ""
    
#     except Exception as e:
#         print(f"Error reading PDF: {e}")
    
#     return text.strip() if text else "Error extracting text"

# def extract_text_from_docx(docx_path):
#     try:
#         doc = docx.Document(docx_path)
#         return "\n".join([para.text for para in doc.paragraphs])
#     except Exception as e:
#         print(f"Error reading DOCX: {e}")
#         return "Error extracting text"

# def extract_text(file_path):
#     """Detects file type and extracts text accordingly."""
#     ext = os.path.splitext(file_path)[1].lower()
#     if ext == ".pdf":
#         return extract_text_from_pdf(file_path)
#     elif ext == ".docx":
#         return extract_text_from_docx(file_path)
#     else:
#         return f"Error: Unsupported file format ({ext})"

# # Load the spaCy NLP model
# nlp = spacy.load("en_core_web_sm")

# def match_keywords(resume_text, job_description):
#     """Matches keywords from job description with extracted resume text."""
#     resume_doc = nlp(resume_text.lower())
#     job_doc = nlp(job_description.lower())

#     # Extracting only nouns, proper nouns, and verbs for better matching
#     resume_tokens = {token.lemma_ for token in resume_doc if not token.is_stop and token.pos_ in {"NOUN", "PROPN", "VERB"}}
#     job_tokens = {token.lemma_ for token in job_doc if not token.is_stop and token.pos_ in {"NOUN", "PROPN", "VERB"}}

#     matched_keywords = resume_tokens.intersection(job_tokens)
#     match_score = (len(matched_keywords) / len(job_tokens)) * 100 if len(job_tokens) > 0 else 0

#     return {"matched_keywords": list(matched_keywords), "score": round(match_score, 2)}

# # Load a pre-trained BERT model for embeddings
# bert_model = SentenceTransformer("all-MiniLM-L6-v2")

# def bert_match_keywords(resume_text, job_description):
#     """Uses BERT embeddings to compute similarity between resume and job description."""
#     embeddings = bert_model.encode([resume_text, job_description], convert_to_tensor=True)
#     similarity_score = util.pytorch_cos_sim(embeddings[0], embeddings[1]).item()
#     return {"similarity_score": round(similarity_score * 100, 2)}

# def extract_email_and_phone(text):
#     email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
#     phone_pattern = r"\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b"

#     emails = re.findall(email_pattern, text)
#     phones = re.findall(phone_pattern, text)
    
#     email = emails[0] if emails else None
#     phone = phones[0] if phones else None
    
#     return email, phone


