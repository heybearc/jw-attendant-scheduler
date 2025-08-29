
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('scheduler', '0010_emailconfiguration_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailconfiguration',
            name='gmail_email',
            field=models.EmailField(blank=True, help_text='Gmail address for sending emails'),
        ),
        migrations.AddField(
            model_name='emailconfiguration',
            name='encrypted_gmail_app_password',
            field=models.TextField(blank=True, help_text='Encrypted Gmail App Password (16-character password from Google)'),
        ),
    ]
