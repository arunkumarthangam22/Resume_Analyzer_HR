from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    resume_url = serializers.SerializerMethodField()  # ✅ Custom field to return Cloudinary URL

    class Meta:
        model = Resume
        fields = ['id', 'resume_file', 'resume_url', 'email', 'phone_number', 'uploaded_at', 'shortlisted', 'ats_score']

    def get_resume_url(self, obj):
        """Returns the Cloudinary URL of the uploaded resume."""
        if obj.resume_file:
            return obj.resume_file.url  # ✅ Returns Cloudinary URL
        return None  # ✅ Handles cases where no file is uploaded
