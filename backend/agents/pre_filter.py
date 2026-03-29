from .ollama_client import generate_json

def pre_filter_cv(jd_text: str, claimed_data: dict) -> dict:
    prompt = f"""You are an AI pre-filter gatecheck.
Evaluate the candidate against the Job Description using the following strict weightings:
- Skills Match: 70% weight (Score out of 70)
- Experience Match: 15% weight (Score out of 15)
- Other Requirements: 15% weight (Score out of 15)

Job Description:
{jd_text}

Candidate Data:
{claimed_data}

Calculate the total score out of 100. If the total score is above 40, they pass this lenient pre-filter.
Return STRICTLY a JSON object matching this schema:
{{
  "pass": true,
  "skills_score": 0,
  "experience_score": 0,
  "other_score": 0,
  "total_score": 0,
  "comparison_results": "<Detailed breakdown of how the candidate compares to the JD>",
  "reason": "<Brief reason for pass/fail>"
}}

Return ONLY valid JSON.
"""
    return generate_json(prompt, model="tinyllama:1.1b")
