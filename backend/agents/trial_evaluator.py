from .ollama_client import generate_json

def evaluate_trial(jd_text: str, cv_text: str) -> dict:
    prompt = f"""
    You are an AI Manager evaluating a candidate's 2-week trial performance.
    
    Job Role:
    {jd_text}
    
    Candidate Profile:
    {cv_text}
    
    Simulate the results of a 2-week trial and comprehensively evaluate the candidate out of 10.
    Return STRICTLY a JSON object matching this schema:
    {{
      "quality": <number 0-10>,
      "speed": <number 0-10>,
      "adaptability": <number 0-10>,
      "collaboration": <number 0-10>,
      "final_score": <number 0-10>,
      "verdict": "hire" or "no-hire",
      "summary": "<comprehensive review summary>"
    }}
    
    Return ONLY JSON. Do not include markdown formatting like ```json.
    """
    return generate_json(prompt)
