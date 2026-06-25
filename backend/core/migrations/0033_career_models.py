from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0032_notification"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ResumeAnalysis",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.FileField(blank=True, null=True, upload_to="resumes/")),
                ("raw_text", models.TextField(blank=True)),
                ("extracted_skills", models.JSONField(default=list)),
                ("experience_level", models.CharField(blank=True, max_length=20)),
                ("years_of_experience", models.FloatField(default=0)),
                ("gap_report", models.JSONField(default=dict)),
                ("analyzed_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="resume_analysis", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="JDAnalysis",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("raw_text", models.TextField()),
                ("job_title", models.CharField(blank=True, max_length=200)),
                ("company", models.CharField(blank=True, max_length=200)),
                ("extracted_skills", models.JSONField(default=list)),
                ("experience_level", models.CharField(blank=True, max_length=20)),
                ("gap_report", models.JSONField(default=dict)),
                ("generated_path", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="core.learningpath")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="jd_analyses", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
