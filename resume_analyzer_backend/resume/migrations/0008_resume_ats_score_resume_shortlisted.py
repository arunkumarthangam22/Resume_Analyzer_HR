# Generated by Django 5.1.6 on 2025-03-02 18:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('resume', '0007_resume_uploaded_at_alter_resume_resume_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='resume',
            name='ats_score',
            field=models.FloatField(default=0.0),
        ),
        migrations.AddField(
            model_name='resume',
            name='shortlisted',
            field=models.BooleanField(default=False),
        ),
    ]
