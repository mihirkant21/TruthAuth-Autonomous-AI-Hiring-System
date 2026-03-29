from .ollama_client import generate_json

def generate_interview_prompt(candidate_data: dict, jd_text: str) -> dict:
    """
    Generates a personalized, single, rigorous interview question.
    Returns: {"question": "The question string", "context": "Brief context on why"}
    """
    skills = candidate_data.get("skills", [])
    if isinstance(skills, list):
        skills_str = ", ".join(skills) if skills else "General"
    else:
        skills_str = str(skills) if skills else "General"

    prompt = f"""You are an Expert AI Technical Recruiter conducting a live vocal interview.
    
CANDIDATE SKILLS: {skills_str}
JOB DESCRIPTION: {jd_text}

Generate ONE incredibly deep, personalized interview scenario question.
Focus strictly on presenting them with a tough, realistic scenario they would face on the job based on their claimed skills.
The candidate will have 3 minutes to audio-record their verbal response to this scenario.

Constraints:
- Do NOT ask generic questions like "tell me about yourself".
- Make it tough and highly domain-specific.
- Output ONLY valid JSON, no markdown.

OUTPUT FORMAT:
{{
  "question": "The tough scenario question text",
  "context": "A short 1-sentence explanation of what this tests"
}}
"""
    result = generate_json(prompt, model="qwen2.5:3b")
    
    if not result or "question" not in result:
        return {
            "question": f"Given your background in {skills_str}, describe a highly complex problem you solved under pressure, the architectural or strategic decisions you made, and what you learned from the outcome.",
            "context": "Testing problem-solving and critical thinking under pressure."
        }
        
    return result
