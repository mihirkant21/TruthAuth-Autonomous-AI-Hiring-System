from .ollama_client import generate_json

def evaluate_task(claimed_data: dict, task_submission: str) -> dict:
    prompt = f"""
    You are an AI Manager validating a candidate's actual skill levels based on a submitted technical task.
    
    Candidate's Claimed Skills & Experience:
    {claimed_data}
    
    Simulated or Actual Task Submission Log:
    {task_submission}
    
    Evaluate to what degree their performance verifies their claims.
    Return STRICTLY a JSON object matching this schema:
    {{
      "task_score": <number 0-10>,
      "consistency": "<how consistent is the performance with their claims?>",
      "completion": "<summary of task completion quality>"
    }}
    
    Return ONLY JSON. Do not include markdown formatting.
    """
    return generate_json(prompt, model="qwen2.5:3b")
