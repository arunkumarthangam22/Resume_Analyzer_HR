from rest_framework import serializers
from .models import Resume

class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'resume_file', 'email', 'phone_number', 'uploaded_at','shortlisted','ats_score']
