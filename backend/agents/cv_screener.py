from .ollama_client import generate_json

def screen_cv(jd_text: str, claimed_data: dict, relaxed: bool = False) -> dict:
    condition = "Be exceptionally lenient in scoring (add +2 to normal score) because we relaxed criteria." if relaxed else "Be strict and objective."
    prompt = f"""
    You are an expert AI Recruiter screening resumes. 
    Review the Candidate's Extracted Claimed Data against the Job Description.
    {condition}
    
    Job Description:
    {jd_text}
    
    Claimed Data:
    {claimed_data}
    
    Evaluate the candidate and return STRICTLY a JSON object matching this schema:
    {{
      "score": <number 0-10>,
      "decision": "advance" or "reject"
    }}
    
    Return ONLY JSON. Do not include markdown formatting.
    """
    return generate_json(prompt)
