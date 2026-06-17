#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    
    # Silence BrokenPipeError in Django development server
    from django.core.servers.basehttp import WSGIRequestHandler
    import logging
    
    original_handle_error = WSGIRequestHandler.handle_error
    def handle_error_quietly(self, request, client_address):
        if sys.exc_info()[0] in (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            pass # Ignore broken pipes completely
        else:
            original_handle_error(self, request, client_address)
            
    WSGIRequestHandler.handle_error = handle_error_quietly

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
