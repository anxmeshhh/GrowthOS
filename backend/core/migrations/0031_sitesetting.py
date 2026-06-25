from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0030_revive_xp_constraint"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(db_index=True, max_length=100, unique=True)),
                ("value", models.CharField(blank=True, default="", max_length=500)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
