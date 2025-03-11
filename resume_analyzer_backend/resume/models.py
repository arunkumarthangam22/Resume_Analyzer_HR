from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError


def validate_resume_file(value):
    if not value.name.endswith(('.pdf', '.docx')):
        raise ValidationError("Only PDF and DOCX files are allowed.")
    

class Resume(models.Model):
    resume_file = models.FileField(upload_to='resumes/',  validators=[validate_resume_file],null=False, blank=False)
    uploaded_at = models.DateTimeField(default=timezone.now)  # Set default
    ats_score = models.FloatField(default=0.0)  # Store ATS score
    shortlisted = models.BooleanField(default=False)  # Mark if shortlisted
    email = models.EmailField(null=True, blank=True)  # New field to store email
    phone_number = models.CharField(max_length=15, null=True, blank=True)  # New field to store phone number
    extracted_text = models.TextField(blank=True, null=True)  # Add this if missing

    
    def __str__(self):
        return f"{self.resume_file.name} - ATS: {self.ats_score}" if self.resume_file else "Unnamed Resume"

class HRSettings(models.Model):
    ats_threshold = models.FloatField(default=0.5)  # Default threshold 50%

    def __str__(self):
        return f"ATS Threshold: {self.ats_threshold}"



def resume_upload_path(instance, filename):
    """Store uploaded resumes in the 'resumes/' directory inside media."""
    return f"resumes/{filename}"

