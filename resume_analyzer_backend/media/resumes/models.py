from django.db import models

def resume_upload_path(instance, filename):
    return f"resumes/{filename}"  # Ensure correct path

class Resume(models.Model):
    resume_file = models.FileField(upload_to=resume_upload_path)
