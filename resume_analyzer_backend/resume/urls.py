from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from .views import (
    ResumeUploadView,analyze_resume_combined, get_resumes,delete_resume,
    get_shortlisted_candidates, set_ats_threshold, generate_pdf_report, generate_excel_report,ResumeListView
)

urlpatterns = [
    path('upload/', ResumeUploadView.as_view(), name='resume-upload'),
    path('analyze/', analyze_resume_combined, name='analyze-resume'),
    
    # Shortlisted Candidates & ATS Score
    path('shortlisted/', get_shortlisted_candidates, name='shortlisted-candidates'),
    path('set-threshold/', set_ats_threshold, name='set-ats-threshold'),
    
    # Report Generation
    path('report/pdf/', generate_pdf_report, name='generate-pdf-report'),
    path('report/excel/', generate_excel_report, name='generate-excel-report'),

    # View all resumes
    path('list/', ResumeListView.as_view(), name="resume-list"), 
    path('resumes/', get_resumes, name="get-resumes"),  # ✅ API to get all resumes


    path('resumes/<int:resume_id>/delete/', delete_resume, name='delete-resume'),
    
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

