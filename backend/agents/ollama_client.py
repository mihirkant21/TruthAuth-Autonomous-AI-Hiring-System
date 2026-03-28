import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
MODEL_NAME = os.getenv("MODEL_NAME", "glm4")

def generate_text(prompt: str, format_json: bool = False, model: str = None) -> str:
    target_model = model if model else MODEL_NAME
    payload = {
        "model": target_model,
        "prompt": prompt,
        "stream": False
    }
    if format_json:
        payload["format"] = "json"
        
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "")
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return ""

def generate_json(prompt: str, model: str = None) -> dict:
    result = generate_text(prompt, format_json=True, model=model)
    try:
        if not result:
            return {}
        return json.loads(result)
    except json.JSONDecodeError:
        print(f"Failed to parse JSON from Ollama. Raw: {result}")
        # Try finding JSON block
        try:
            if "```json" in result:
                bl = result.split("```json")[1].split("```")[0]
                return json.loads(bl)
        except Exception:
            pass
        return {}
