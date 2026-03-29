from .ollama_client import generate_json

def extract_resume(cv_text: str) -> dict:
    prompt = f"""You are an expert AI Resume Extractor.
Extract the core claims from the following CV into structured data.

Candidate Resume:
{cv_text}

Return STRICTLY a valid JSON object matching this schema exactly:
{{
  "name": "<candidate's full name>",
  "skills": ["<skill1>", "<skill2>"],
  "experience": "<summary of professional experience>",
  "experience_years": <number of years>,
  "tools": ["<tool1>", "<tool2>"]
}}

Rules:
- All skills must be lowercase.
- Use simple terms (e.g. "postgresql", "fastapi", "python").
- Return ONLY JSON. Do not include markdown formatting, explanations, or extra text.
"""
    return generate_json(prompt, model="gemma3:4b")
