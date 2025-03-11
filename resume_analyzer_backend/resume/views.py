import os
import json
import pandas as pd
from io import BytesIO
from django.views import View
from django.db import connection
from django.core.files.storage import default_storage
from django.http import JsonResponse, HttpResponse, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework.decorators import api_view
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from io import BytesIO
from django.http import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from resume.models import Resume
from resume.models import Resume, HRSettings
from .serializers import ResumeSerializer
from .utils import compute_ats_score, extract_text, extract_email_and_phone


# ✅ Allowed file types
ALLOWED_EXTENSIONS = [".pdf", ".docx"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# ✅ Resume Upload & Processing (Supports Multiple Files)
class ResumeUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        try:
            files = request.FILES.getlist("resume_file")  # ✅ Get multiple files
            if not files:
                return Response({"error": "No files uploaded"}, status=status.HTTP_400_BAD_REQUEST)

            uploaded_resumes = []  # ✅ Store results for each file

            for file_obj in files:
                print("✅ Processing file:", file_obj.name)

                # ✅ Save the file
                file_path = default_storage.save(f"resumes/{file_obj.name}", file_obj)
                full_file_path = os.path.join(default_storage.location, file_path)
                print("📂 File saved at:", full_file_path)

                # ✅ Extract text from resume
                resume_text = extract_text(full_file_path)
                if not resume_text:
                    return Response({"error": f"Failed to extract text from {file_obj.name}"}, status=status.HTTP_400_BAD_REQUEST)

                print("📝 Extracted text:", resume_text[:100])

                # ✅ Get job data from request
                job_data_str = request.data.get("job_data")
                if job_data_str:
                    job_data = json.loads(job_data_str)  # Convert from JSON string to dictionary
                else:
                    return Response({"error": "Job data is missing"}, status=status.HTTP_400_BAD_REQUEST)

                print("📊 Job Data Received:", job_data)

                # ✅ Get ATS threshold (default 60)
                ats_threshold = float(job_data.get("ats_threshold", 60))

                # ✅ Compute ATS Score
                ats_score = compute_ats_score(resume_text, job_data)
                print(f"⭐ ATS Score for {file_obj.name}: {ats_score['final_ats_score']}")

                email, phone_number = extract_email_and_phone(resume_text)

                # ✅ Determine Shortlisting Status
                is_shortlisted = ats_score["final_ats_score"] >= ats_threshold

                # ✅ Save resume to the database
                resume_instance = Resume.objects.create(
                    resume_file=file_path,
                    extracted_text=resume_text,
                    email=email,
                    phone_number=phone_number,
                    ats_score=ats_score["final_ats_score"],
                    shortlisted=is_shortlisted
                )
                resume_instance.save()

                # ✅ Append each uploaded resume's results
                uploaded_resumes.append({
                    "resume_id": resume_instance.id,
                    "file_name": file_obj.name,
                    "ats_score": ats_score["final_ats_score"],
                    "email": email,
                    "phone_number": phone_number,
                    "shortlisted": is_shortlisted
                })

            return Response({
                "message": "Upload successful",
                "resumes": uploaded_resumes
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("❌ Error in ResumeUploadView:", str(e))
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ✅ Resume Analysis (ATS Scoring & Shortlisting)
@api_view(['POST'])
def analyze_resume_combined(request):
    """Analyzes a resume and calculates ATS score."""
    resume_id = request.data.get("resume_id")
    job_data = request.data.get("job_data", {})

    if not resume_id or not job_data:
        return Response({"error": "Resume ID and Job Data are required."}, status=400)

    try:
        resume = Resume.objects.get(id=resume_id)
        resume_text = extract_text(resume.resume_file.path)

        # Compute ATS Score
        ats_result = compute_ats_score(resume_text, job_data)

        # Update the resume in the database
        resume.ats_score = ats_result["final_ats_score"]
        resume.shortlisted = resume.ats_score >= job_data.get("ats_threshold", 60)  # Default threshold 60%
        resume.save()

        return Response({
            "message": "Resume analyzed successfully",
            "ats_scores": ats_result["scores"],
            "final_ats_score": ats_result["final_ats_score"],
            "shortlisted": resume.shortlisted
        })

    except Resume.DoesNotExist:
        return Response({"error": "Resume not found"}, status=404)


# ✅ Get All Resumes
@api_view(['GET'])
def get_resumes(request):
    """Retrieves all uploaded resumes sorted by ATS score (highest first)."""
    resumes = Resume.objects.all().order_by('-ats_score')  # ✅ Ensure sorting
    serializer = ResumeSerializer(resumes, many=True)
    return Response(serializer.data)



class ResumeListView(View):
    def get(self, request, *args, **kwargs):
        resumes = Resume.objects.all().values("id", "resume_file", "ats_score", "email", "phone_number", "shortlisted")
        return JsonResponse({"resumes": list(resumes)}, safe=False)
    


# ✅ Get Shortlisted Candidates
@api_view(['GET'])
def get_shortlisted_candidates(request):
    """Retrieves shortlisted candidates based on ATS score threshold."""
    hr_settings = HRSettings.objects.first()
    threshold = hr_settings.ats_threshold if hr_settings else 60

    connection.close()
    shortlisted_candidates = Resume.objects.filter(ats_score__gte=threshold).order_by('-ats_score')

    if not shortlisted_candidates.exists():
        return Response({"message": "No candidates shortlisted."}, status=status.HTTP_200_OK)

    serializer = ResumeSerializer(shortlisted_candidates, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ✅ Set ATS Threshold
@api_view(['POST'])
def set_ats_threshold(request):
    """Updates the ATS score threshold dynamically."""
    try:
        threshold = request.data.get("threshold")

        if threshold is None or not isinstance(threshold, (int, float)) or not (0 <= float(threshold) <= 100):
            return Response({"error": "Invalid threshold value. Must be between 0 and 100."}, status=status.HTTP_400_BAD_REQUEST)

        hr_settings, created = HRSettings.objects.get_or_create(id=1)
        hr_settings.ats_threshold = float(threshold)
        hr_settings.save()

        return Response({"message": "ATS threshold updated successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django.http import HttpResponse, FileResponse
import pandas as pd
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from resume.models import Resume

# 📂 Generate and Return Excel Report
import pandas as pd
from io import BytesIO
from django.http import HttpResponse
import xlsxwriter
from resume.models import Resume

# def generate_excel_report(request):
#     """Generates an enhanced Excel report for all resumes."""
    
#     shortlisted = Resume.objects.all().values_list("resume_file", "email", "phone_number", "ats_score", "shortlisted")

#     if not shortlisted:
#         return HttpResponse("No resumes available.", content_type="text/plain")

#     # ✅ Convert QuerySet to DataFrame
#     df = pd.DataFrame(shortlisted, columns=["Resume File", "Email", "Phone Number", "ATS Score", "Shortlisted"])

#     # ✅ Convert "Shortlisted" column to Yes/No
#     df["Shortlisted"] = df["Shortlisted"].apply(lambda x: "✅ Yes" if x else "❌ No")

#     buffer = BytesIO()
    
#     # ✅ Create Excel Writer
#     with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
#         df.to_excel(writer, index=False, sheet_name="Resumes")
        
#         workbook = writer.book
#         worksheet = writer.sheets["Resumes"]

#         # ✅ Formatting
#         header_format = workbook.add_format({"bold": True, "align": "center", "bg_color": "#D3D3D3", "border": 1})
#         percent_format = workbook.add_format({"num_format": "0.00%", "align": "center"})
#         yes_format = workbook.add_format({"bg_color": "#C6EFCE", "bold": True})
#         no_format = workbook.add_format({"bg_color": "#FFC7CE", "bold": True})
#         center_format = workbook.add_format({"align": "center"})

#         # ✅ Apply Formatting
#         for col_num, value in enumerate(df.columns):
#             worksheet.write(0, col_num, value, header_format)  # Apply header style
#             worksheet.set_column(col_num, col_num, 20, center_format)  # Set column width

#         # ✅ Format "ATS Score" as percentage
#         worksheet.set_column("D:D", 15, percent_format)  

#         # ✅ Conditional Formatting for "Shortlisted"
#         worksheet.conditional_format("E2:E{}".format(len(df) + 1), 
#                                      {"type": "text", "criteria": "containing", "value": "Yes", "format": yes_format})
#         worksheet.conditional_format("E2:E{}".format(len(df) + 1), 
#                                      {"type": "text", "criteria": "containing", "value": "No", "format": no_format})

#         writer.close()
    
#     buffer.seek(0)

#     # ✅ Serve the Excel file as a response
#     response = HttpResponse(buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
#     response["Content-Disposition"] = 'attachment; filename="resumes.xlsx"'

#     return response


# # 📝 Generate and Return PDF Report
# def generate_pdf_report(request):
#     buffer = BytesIO()
#     doc = SimpleDocTemplate(buffer, pagesize=letter)
#     elements = []

#     # ✅ Styles
#     styles = getSampleStyleSheet()

#     # ✅ Title
#     title = Paragraph("<b>All Candidate Resume information</b>", styles["Title"])
#     elements.append(title)
#     elements.append(Paragraph("<br/><br/>", styles["Normal"]))  # Add spacing

#     # ✅ Fetch Resume Data
#     resumes = Resume.objects.all().values("id", "email", "phone_number", "ats_score", "shortlisted")

#     if not resumes:
#         elements.append(Paragraph("No resumes found.", styles["Normal"]))
#     else:
#         # ✅ Table Headers
#         data = [["ID", "Email", "Phone", "ATS Score", "Shortlisted"]]

#         # ✅ Add Resume Data to Table
#         for resume in resumes:
#             shortlisted_status = "Yes" if resume["shortlisted"] else "No"
#             data.append([
#                 str(resume["id"]),
#                 resume["email"] or "N/A",
#                 resume["phone_number"] or "N/A",
#                 f"{resume['ats_score']:.2f}%",
#                 shortlisted_status
#             ])

#         # ✅ Create Table
#         table = Table(data, colWidths=[1 * inch, 2.5 * inch, 2 * inch, 1.5 * inch, 1.5 * inch])

#         # ✅ Table Styling
#         table.setStyle(TableStyle([
#             ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
#             ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
#             ("ALIGN", (0, 0), (-1, -1), "CENTER"),
#             ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
#             ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
#             ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
#             ("GRID", (0, 0), (-1, -1), 1, colors.black),
#         ]))

#         elements.append(table)

#     # ✅ Build PDF
#     doc.build(elements)
#     buffer.seek(0)

#     return FileResponse(buffer, as_attachment=True, filename="shortlisted_resumes.pdf")


import pandas as pd
from django.http import HttpResponse
from io import BytesIO
from resume.models import Resume

def generate_excel_report(request):
    """Generates an enhanced Excel report for resumes based on filter selection."""

    # ✅ Get filter type from request
    filter_type = request.GET.get("filter", "all")

    if filter_type == "shortlisted":
        resumes = Resume.objects.filter(shortlisted=True)
    elif filter_type == "not_shortlisted":
        resumes = Resume.objects.filter(shortlisted=False)
    else:
        resumes = Resume.objects.all()

    if not resumes.exists():
        return HttpResponse("No resumes available.", content_type="text/plain")

    # ✅ Convert QuerySet to DataFrame
    df = pd.DataFrame.from_records(resumes.values("resume_file", "email", "phone_number", "ats_score", "shortlisted"))

    # ✅ Rename Columns for Readability
    df.rename(columns={
        "resume_file": "Resume File",
        "email": "Email",
        "phone_number": "Phone Number",
        "ats_score": "ATS Score (%)",
        "shortlisted": "Shortlisted"
    }, inplace=True)

    # ✅ Convert "Shortlisted" column to Yes/No
    df["Shortlisted"] = df["Shortlisted"].apply(lambda x: "✅ Yes" if x else "❌ No")

    buffer = BytesIO()

    # ✅ Create Excel Writer
    with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
        df.to_excel(writer, index=False, sheet_name="Resumes")

        workbook = writer.book
        worksheet = writer.sheets["Resumes"]

        # ✅ Formatting
        header_format = workbook.add_format({"bold": True, "align": "center", "bg_color": "#D3D3D3", "border": 1})
        percent_format = workbook.add_format({"num_format": "0.00%", "align": "center"})
        yes_format = workbook.add_format({"bg_color": "#C6EFCE", "bold": True})
        no_format = workbook.add_format({"bg_color": "#FFC7CE", "bold": True})
        center_format = workbook.add_format({"align": "center"})

        # ✅ Apply Formatting
        for col_num, value in enumerate(df.columns):
            worksheet.write(0, col_num, value, header_format)  # Apply header style
            worksheet.set_column(col_num, col_num, 20, center_format)  # Set column width

        # ✅ Format "ATS Score" as percentage
        worksheet.set_column("D:D", 15, percent_format)  

        # ✅ Conditional Formatting for "Shortlisted"
        worksheet.conditional_format("E2:E{}".format(len(df) + 1), 
                                     {"type": "text", "criteria": "containing", "value": "Yes", "format": yes_format})
        worksheet.conditional_format("E2:E{}".format(len(df) + 1), 
                                     {"type": "text", "criteria": "containing", "value": "No", "format": no_format})

        writer.close()

    buffer.seek(0)

    # ✅ Serve the Excel file as a response
    response = HttpResponse(buffer.read(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = 'attachment; filename="resumes.xlsx"'

    return response

from django.http import FileResponse
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from resume.models import Resume

def generate_pdf_report(request):
    """Generates a detailed PDF report of resumes with filtering options."""
    
    filter_type = request.GET.get("filter", "all")

    if filter_type == "shortlisted":
        resumes = Resume.objects.filter(shortlisted=True)
    elif filter_type == "not_shortlisted":
        resumes = Resume.objects.filter(shortlisted=False)
    else:
        resumes = Resume.objects.all()

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()

    # ✅ Title
    title = Paragraph(f"<b>Resume Report ({filter_type.capitalize()} Candidates)</b>", styles["Title"])
    elements.append(title)
    elements.append(Paragraph("<br/><br/>", styles["Normal"]))

    if not resumes.exists():
        elements.append(Paragraph("No resumes found.", styles["Normal"]))
    else:
        # ✅ Table Headers
        data = [["ID", "Email", "Phone", "ATS Score", "Shortlisted"]]

        # ✅ Add Resume Data to Table
        for resume in resumes:
            shortlisted_status = "✅ Yes" if resume.shortlisted else "❌ No"
            data.append([
                str(resume.id),
                resume.email or "N/A",
                resume.phone_number or "N/A",
                f"{resume.ats_score:.2f}%",
                shortlisted_status
            ])

        # ✅ Create Table
        table = Table(data, colWidths=[1 * inch, 2.5 * inch, 2 * inch, 1.5 * inch, 1.5 * inch])

        # ✅ Table Styling
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ]))

        elements.append(table)

    # ✅ Build PDF
    doc.build(elements)
    buffer.seek(0)

    return FileResponse(buffer, as_attachment=True, filename="resumes.pdf")













@api_view(['DELETE'])
def delete_resume(request, resume_id):
    """Deletes a specific resume by ID."""
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.delete()
        return Response({"message": "Resume deleted successfully"}, status=status.HTTP_200_OK)
    except Resume.DoesNotExist:
        return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


