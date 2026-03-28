from .ollama_client import generate_text

def generate_jd(title: str, skills: str, experience: str) -> str:
    prompt = f"""
    You are an expert HR Recruiter. Generate a professional Job Description for the following role:
    Title: {title}
    Required Skills: {skills}
    Experience Required: {experience}
    
    Structure the JD with:
    1. Role Summary
    2. Key Responsibilities
    3. Qualifications
    """
    return generate_text(prompt)
