from django.core.management.base import BaseCommand
import fitz
import os

class Command(BaseCommand):
    help = 'Analyzes PDF roadmaps in the resource directory'

    def handle(self, *args, **options):
        pdf_names = {
            "backend": "backend.pdf",
            "frontend": "frontend.pdf",
            "api_design": "api-design.pdf",
            "ai": "ai-engineer.pdf",
            "dsa": "datastructures-and-algorithms.pdf",
            "django": "django.pdf",
            "sql": "sql.pdf",
            "system_design": "system-design.pdf",
        }

        # Since this runs from manage.py, the base directory is backend/
        # The resource directory is at the root of GrowthOS
        # GrowthOS/backend -> GrowthOS/resource
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        resource_dir = os.path.join(base_dir, 'resource')
        
        # Fallback to relative path if not found
        if not os.path.exists(resource_dir):
            resource_dir = os.path.join('..', 'resource')

        self.stdout.write(self.style.SUCCESS(f'Scanning directory: {resource_dir}'))

        for path_id, filename in pdf_names.items():
            path = os.path.join(resource_dir, filename)
            if not os.path.exists(path):
                self.stdout.write(self.style.WARNING(f"File {path} does not exist!"))
                continue
            
            try:
                doc = fitz.open(path)
                page = doc[0]
                self.stdout.write(f"Path ID: {path_id} ({filename}) -> page size: {page.rect.width:.1f}x{page.rect.height:.1f}, drawings: {len(page.get_drawings())}, text blocks: {len(page.get_text('blocks'))}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error reading {filename}: {str(e)}"))
