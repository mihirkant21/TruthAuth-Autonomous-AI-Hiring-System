from .ollama_client import generate_json

def extract_resume(cv_text: str) -> dict:
    prompt = f"""
    You are an expert AI Resume Extractor.
    Extract the core claims from the following resume into structured data.
    
    Candidate Resume:
    {cv_text}
    
    Return STRICTLY a JSON object matching this schema:
    {{
      "name": "<candidate's full name>",
      "skills": ["<skill1>", "<skill2>"],
      "experience": "<summary of years and roles>",
      "projects": ["<project1>", "<project2>"]
    }}
    
    Return ONLY JSON. Do not include markdown formatting.
    """
    return generate_json(prompt)
