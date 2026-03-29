from .ollama_client import generate_json

def generate_assessment(candidate_data: dict) -> dict:
    """
    Generate a personalized interview assessment for a candidate.
    Returns strict JSON with candidate_level, mcq (3), coding (2), task (1).
    Falls back to Intermediate level if candidate_data is incomplete.
    """
    # Extract specific skills so the AI focuses its questions on them
    skills = candidate_data.get("skills", [])
    if isinstance(skills, list):
        skills_str = ", ".join(skills) if skills else "General Software Engineering"
    else:
        skills_str = str(skills) if skills else "General Software Engineering"

    experience = candidate_data.get("experience", "Not provided")
    name = candidate_data.get("name", "Candidate")

    prompt = f"""You are an AI Interview Assessment Generator integrated into a production hiring system.

STRICT RULES:
- Output ONLY valid JSON (no explanations, no extra text, no markdown)
- Do NOT change schema
- Do NOT add/remove fields
- Keep questions clear, concise, and professional
- Difficulty must match candidate skill level
- Avoid ambiguity
- Ensure all questions are answerable

CANDIDATE PROFILE:
- Name: {name}
- Skills: {skills_str}
- Experience: {experience}
- Full Profile: {candidate_data}

ROLE:
Generate a PERSONALIZED interview assessment. Every question MUST be directly related to the candidate's listed skills: {skills_str}
Do NOT generate generic questions. Each MCQ must test knowledge of one of: {skills_str}
Each Practical Challenge must apply their skills to a relevant scenario (if tech role: coding/systems; if non-tech: case studies/drafting).
The real-world task must simulate a job project using: {skills_str}

OUTPUT FORMAT (STRICT JSON):
{{
  "candidate_level": "Beginner | Intermediate | Advanced",
  "mcq": [
    {{
      "question": "",
      "options": ["", "", "", ""],
      "answer": ""
    }}
  ],
  "practical": [
    {{
      "title": "",
      "description": "",
      "difficulty": "Easy | Medium | Hard"
    }}
  ],
  "task": [
    {{
      "title": "",
      "description": "",
      "expected_outcome": ""
    }}
  ]
}}

CONSTRAINTS:
- Generate EXACTLY:
  - 3 MCQs (testing knowledge relevant to their role and skills)
  - 2 Practical Challenges (If tech role: generate coding problems. If non-tech role like sales, marketing, HR, or finance: generate scenario-based case studies or situational problems)
  - 1 Real-world Task (A concrete assignment they must submit via a link, entirely relevant to their profession)
- MCQs must have 4 options and 1 correct answer
- No duplicate questions
- No placeholders

FAIL-SAFE:
If candidate data is incomplete:
- Assume "Intermediate" level
- Still generate full output based on available skills

SYSTEM PRIORITY:
This output will be directly rendered in the candidate portal.
- Keep text clean (no special symbols like *, #, etc.)
- Avoid long paragraphs
- Max 2-3 lines per description

Return ONLY JSON. Do not include markdown formatting."""

    result = generate_json(prompt, model="qwen2.5:3b")

    # Validate and guarantee the required structure
    if not result or not isinstance(result, dict):
        return _fallback_assessment()

    has_mcq    = isinstance(result.get("mcq"), list)       and len(result["mcq"]) >= 1
    has_practical = isinstance(result.get("practical"), list) and len(result["practical"]) >= 1
    has_task   = isinstance(result.get("task"), list)      and len(result["task"]) >= 1

    if not (has_mcq and has_practical and has_task):
        return _fallback_assessment()

    # Normalise — trim to exact counts
    result["mcq"]       = result["mcq"][:3]
    result["practical"] = result["practical"][:2]
    result["task"]      = result["task"][:1]

    if "candidate_level" not in result:
        result["candidate_level"] = "Intermediate"

    return result


def _fallback_assessment() -> dict:
    """Returns a safe generic assessment when the LLM fails."""
    return {
        "candidate_level": "Intermediate",
        "mcq": [
            {
                "question": "What does REST stand for in the context of web APIs?",
                "options": [
                    "Representational State Transfer",
                    "Remote Execution Standard Technology",
                    "Relational Entity Structure Template",
                    "Request Encryption Security Toolkit"
                ],
                "answer": "Representational State Transfer"
            },
            {
                "question": "Which data structure uses LIFO (Last In, First Out) ordering?",
                "options": ["Queue", "Stack", "Linked List", "Hash Map"],
                "answer": "Stack"
            },
            {
                "question": "What is the time complexity of binary search on a sorted array?",
                "options": ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
                "answer": "O(log n)"
            }
        ],
        "practical": [
            {
                "title": "Reverse a String",
                "description": "Write a function that takes a string as input and returns it reversed. Handle edge cases like empty strings and single characters.",
                "difficulty": "Easy"
            },
            {
                "title": "Find Duplicates in an Array",
                "description": "Given an array of integers, return a list of all elements that appear more than once. Optimize for time complexity.",
                "difficulty": "Medium"
            }
        ],
        "task": [
            {
                "title": "Design a Simple REST API",
                "description": "Design and document a REST API for a basic task management system. Define endpoints for creating, reading, updating, and deleting tasks.",
                "expected_outcome": "A clear API design document with endpoint definitions, request/response schemas, and error handling strategies."
            }
        ]
    }
