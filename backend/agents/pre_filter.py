from .ollama_client import generate_json

def pre_filter_cv(jd_text: str, claimed_data: dict) -> dict:
    prompt = f"""
    You are an AI doing a very fast pre-filter gatecheck on a candidate.
    Look at the Job Description and the Candidate's extracted data.
    Does the candidate meet the absolute minimum basic requirements?
    
    Job Description:
    {jd_text}
    
    Candidate Data:
    {claimed_data}
    
    Be lenient, but if the candidate is completely irrelevant to the job, reject them.
    Return STRICTLY a JSON object matching this schema:
    {{
      "pass": true or false,
      "reason": "<Brief reason for the decision>"
    }}
    
    Return ONLY JSON. Do not include markdown formatting.
    """
    return generate_json(prompt, model="tinyllama:1.1b")
