import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.cv_screener import screen_cv
from agents.pre_filter import pre_filter_cv

jd = "Backend Developer. Skills: Python, FastAPI. Experience: 2 years."
cv = {"name": "Test User", "skills": ["python", "fastapi"], "experience": "3 years of backend dev", "experience_years": 3, "tools": []}

print("\n--- PRE FILTER ---")
try:
    print(pre_filter_cv(jd, cv))
except Exception as e:
    print("Pre-filter Error:", e)

print("\n--- SCREENER ---")
try:
    print(screen_cv(jd, cv))
except Exception as e:
    print("Screener Error:", e)
