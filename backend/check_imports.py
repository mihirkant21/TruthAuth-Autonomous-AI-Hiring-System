import sys

checks = [
    ("reportlab", "from reportlab.lib.pagesizes import letter"),
    ("whisper_service", "import whisper_service"),
    ("pdf_extractor", "from pdf_extractor import extract_text_from_pdf"),
    ("google_forms_service", "from google_forms_service import push_to_forms"),
    ("agents.resume_extractor", "from agents import resume_extractor"),
    ("agents.interview_generator", "from agents.interview_generator import generate_interview_prompt"),
]

all_ok = True
for name, stmt in checks:
    try:
        exec(stmt)
        print(f"  [OK] {name}")
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        all_ok = False

print()
if all_ok:
    print("All imports OK — backend should start cleanly.")
else:
    print("Fix the above FAIL items, then restart uvicorn.")
