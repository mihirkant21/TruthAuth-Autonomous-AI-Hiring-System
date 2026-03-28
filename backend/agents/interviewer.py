from .ollama_client import generate_json

def evaluate_interview(jd_text: str, cv_text: str) -> dict:
    prompt = f"""
    You are an expert AI Technical Interviewer.
    You have just interviewed a candidate for the following Job Description:
    {jd_text}
    
    Candidate Background:
    {cv_text}
    
    Based on the profile fit and simulated responses to behavioral and technical questions, evaluate the candidate.
    Return STRICTLY a JSON object matching this schema:
    {{
      "score": <number 0-10>,
      "feedback": "<detailed feedback summarizing performance>",
      "decision": "pass" or "fail"
    }}
    
    Return ONLY JSON. Do not include markdown formatting like ```json.
    """
    return generate_json(prompt)
