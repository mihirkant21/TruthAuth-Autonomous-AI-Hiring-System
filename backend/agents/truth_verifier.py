from .ollama_client import generate_json

def verify_truth(claimed_data: dict, observed_data: dict, transcript: str) -> dict:
    prompt = f"""
    You are the CORE Truth Verification AI.
    Your job is to detect if a candidate exaggerated or lied on their resume by comparing their claims to actual observed task performance and interview behavior.
    
    Resume Claims (Claimed Data):
    {claimed_data}
    
    Task Performance (Observed Data):
    {observed_data}
    
    Interview Transcript:
    {transcript}
    
    Detect any skill exaggeration or inconsistencies.
    Evaluate their honesty and capability.
    Return STRICTLY a JSON object matching this schema:
    {{
      "truth_score": <number 0-10, lower means they lied/exaggerated, 10 means fully honest>,
      "inconsistencies": ["<inconsistency1>", "<inconsistency2>"],
      "final_score": <overall aggregate score 0-10>,
      "decision": "hire" or "reject",
      "reason": "<detailed reason for verdict>",
      "confidence_score": <number 0-100 indicating confidence in AI assessment>
    }}
    
    Return ONLY JSON. Do not include markdown formatting.
    """
    return generate_json(prompt)
