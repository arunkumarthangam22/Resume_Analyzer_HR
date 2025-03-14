from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from cloudinary_storage.storage import RawMediaCloudinaryStorage  # For Cloudinary storage
from django.core.validators import FileExtensionValidator  # ✅ Correct


def validate_resume_file(value):
    """Validate that the uploaded file is either a PDF or DOCX."""
    allowed_extensions = ['.pdf', '.docx']
    if not any(value.name.lower().endswith(ext) for ext in allowed_extensions):
        raise ValidationError("Only PDF and DOCX files are allowed.")


class Resume(models.Model):
    resume_file = models.FileField(
        storage=RawMediaCloudinaryStorage(),  # Store in Cloudinary
        validators=[FileExtensionValidator(allowed_extensions=["pdf", "docx"])],
        null=False,
        blank=False
    )
    uploaded_at = models.DateTimeField(default=timezone.now)  # Set default
    ats_score = models.FloatField(default=0.0)  # Store ATS score
    shortlisted = models.BooleanField(default=False)  # Mark if shortlisted
    email = models.EmailField(null=True, blank=True)  # Store extracted email
    phone_number = models.CharField(max_length=15, null=True, blank=True)  # Store extracted phone
    extracted_text = models.TextField(blank=True, null=True)  # Store parsed text

    def __str__(self):
        return f"{self.resume_file.name} - ATS: {self.ats_score}" if self.resume_file else "Unnamed Resume"


class HRSettings(models.Model):
    ats_threshold = models.FloatField(default=0.5)  # Default threshold 50%

    def __str__(self):
        return f"ATS Threshold: {self.ats_threshold}"
