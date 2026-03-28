if (!(Test-Path -Path venv)) { python -m venv venv }
.\venv\Scripts\Activate.ps1
pip install fastapi "uvicorn[standard]" sqlalchemy psycopg2-binary reportlab requests pydantic python-dotenv
psql -U postgres -d postgres -c "CREATE DATABASE hiring_db;"
