# Generated by Django 5.1.6 on 2025-03-02 17:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('resume', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resume',
            name='file',
        ),
        migrations.AddField(
            model_name='resume',
            name='resume_file',
            field=models.FileField(blank=True, null=True, upload_to='resumes/'),
        ),
    ]
