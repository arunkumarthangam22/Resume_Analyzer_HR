from django.contrib import admin
from .models import Resume

# @admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ('id', 'resume_file', 'uploaded_at', 'ats_score', 'shortlisted','email', 'phone_number')
    list_filter = ('shortlisted',)
    search_fields = ('resume_file',)
    
admin.site.register(Resume, ResumeAdmin)

# Alternatively, you can use:
# admin.site.register(Resume)
