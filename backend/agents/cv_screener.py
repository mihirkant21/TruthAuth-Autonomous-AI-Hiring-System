from .ollama_client import generate_json

def screen_cv(jd_text: str, claimed_data: dict, relaxed: bool = False) -> dict:
    condition = "Be exceptionally lenient and generous in scoring (add +20 to overall match) because we relaxed criteria." if relaxed else "Be extremely generous, give maximum possible partial credit."
    prompt = f"""You are an AI hiring evaluator.
{condition}

Compare candidate and job.

Candidate:
{claimed_data}

Job:
{jd_text}

Instructions:
- Match skills semantically, not exact words
  Example:
  - "postgres" = "postgresql"
  - "rest api" = "api development"
- Give partial credit if similar
- Do NOT be strict. Give high scores.
- YOU MUST CALCULATE THE ACTUAL SCORE. DO NOT JUST COPY THE EXAMPLE.

Scoring:
- Skills: 50%
- Experience: 30%
- Tools: 20%

Return ONLY JSON:

{{
  "skill_match": 85,
  "experience_match": 90,
  "tools_match": 80,
  "overall_match": 85,
  "reason": "short explanation"
}}"""
    res = generate_json(prompt, model="qwen2.5:3b")
    
    import re
    def parse_int(val):
        if isinstance(val, (int, float)): return int(val)
        if isinstance(val, str):
            nums = re.findall(r'\d+', val)
            return int(nums[0]) if nums else 0
        return 0
        
    # Ensure backwards compatibility and calculate reliably
    try:
        skill = parse_int(res.get("skill_match", 0))
        exp = parse_int(res.get("experience_match", 0))
        tools = parse_int(res.get("tools_match", 0))
        overall = parse_int(res.get("overall_match", 0))
        
        # If the model copied the template or failed math, calculate it manually
        computed_overall = int((skill * 0.5) + (exp * 0.3) + (tools * 0.2))
        if computed_overall > overall:
            overall = computed_overall
            
    except Exception:
        overall = 0

    if relaxed:
        overall = min(100, overall + 20)
    
    res["match_percentage"] = overall
    res["score"] = overall / 10.0
    res["decision"] = "advance" if overall >= 65 else "reject"
    
    return res
