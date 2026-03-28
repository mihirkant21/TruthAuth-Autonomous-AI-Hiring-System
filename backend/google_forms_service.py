"""
google_forms_service.py
-----------------------
Pushes a generated assessment to a Google Form via the Forms API using OAuth2.

Prerequisites:
  1. A `credentials.json` file downloaded from Google Cloud Console (OAuth 2.0 Client IDs).
     Ensure it's in the same directory as this file (`backend/`).
  2. A `GOOGLE_FORM_ID` set in `.env` corresponding to the form you want to update.

First-time setup:
  Run this script directly from the terminal to authenticate:
      python google_forms_service.py
  This will open a browser to authenticate and create a `token.json` file.
  The FastAPI server will then use `token.json` automatically.
"""
import os
import os.path
import json
import logging
from dotenv import load_dotenv

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

load_dotenv()

logger = logging.getLogger("google_forms_service")

# Ensure you have GOOGLE_FORM_ID in your .env
GOOGLE_FORM_ID = os.getenv("GOOGLE_FORM_ID", "")

# If modifying these scopes, delete the file token.json.
SCOPES = ["https://www.googleapis.com/auth/forms.body"]

CREDENTIALS_FILE = "credentials.json"
TOKEN_FILE = "token.json"


def get_credentials():
    """Gets valid user credentials from storage, or prompts the user to log in."""
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        except Exception as e:
            logger.warning("Could not read token.json: %s", e)
            creds = None
            
    # If there are no (valid) credentials available, return None (requires manual auth flow).
    # We don't want to start the InstalledAppFlow server inside FastAPI since it blocks.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(TOKEN_FILE, "w") as token:
                    token.write(creds.to_json())
                return creds
            except Exception as e:
                logger.warning("Could not refresh token: %s", e)
                
        # Cannot silently authenticate.
        return None
        
    return creds


def authenticate_manually():
    """Run this manually (e.g., `python google_forms_service.py`) to generate token.json."""
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                print(f"ERROR: {CREDENTIALS_FILE} not found. Please download OAuth Client ID JSON and place it here.")
                return
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            # Run local server to listen for auth callback
            creds = flow.run_local_server(port=0)
            
        # Save the credentials for the next run
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
            print("Successfully authenticated and generated token.json!")
    else:
        print("token.json already exists and is valid.")


def push_to_forms(assessment: dict, candidate_id: int, candidate_name: str) -> dict:
    """
    Push the assessment questions to a Google Form using the Forms API client.
    """
    if not GOOGLE_FORM_ID:
        logger.info("[Google Forms STUB] GOOGLE_FORM_ID not configured.")
        return {"success": False, "stub": True, "message": "GOOGLE_FORM_ID not configured. Assessment stored in database."}

    creds = get_credentials()
    if not creds:
        error_msg = "Google Forms is not authenticated. Please run `python google_forms_service.py` manually to generate token.json."
        logger.error(error_msg)
        return {"success": False, "error": error_msg}

    try:
        service = build('forms', 'v1', credentials=creds)
        requests_payload = _build_form_requests(assessment, candidate_id, candidate_name)
        
        # Call the Forms API
        result = service.forms().batchUpdate(
            formId=GOOGLE_FORM_ID,
            body={"requests": requests_payload}
        ).execute()

        form_url = f"https://docs.google.com/forms/d/{GOOGLE_FORM_ID}/viewform"
        logger.info("[Google Forms] Assessment pushed successfully for candidate %d", candidate_id)

        return {
            "success": True,
            "form_url": form_url,
            "response": result
        }

    except HttpError as error:
        logger.error("[Google Forms] Failed to push assessment: %s", error)
        return {
            "success": False,
            "error": str(error),
            "message": "Failed to push to Google Forms."
        }


def _build_form_requests(assessment: dict, candidate_id: int, candidate_name: str) -> list:
    """Converts assessment JSON into Google Forms API batchUpdate request items."""
    items = []
    index = 0

    # Section header
    items.append({
        "createItem": {
            "item": {
                "title": f"Interview Assessment — {candidate_name} (ID: {candidate_id})",
                "description": f"Level: {assessment.get('candidate_level', 'Intermediate')}",
                "questionGroupItem": dict()
            },
            "location": {"index": index}
        }
    })
    index += 1

    # MCQ Questions
    for mcq in assessment.get("mcq", []):
        items.append({
            "createItem": {
                "item": {
                    "title": mcq.get("question", ""),
                    "questionItem": {
                        "question": {
                            "required": True,
                            "choiceQuestion": {
                                "type": "RADIO",
                                "options": [
                                    {"value": opt} for opt in mcq.get("options", [])
                                ],
                                "shuffle": False
                            }
                        }
                    }
                },
                "location": {"index": index}
            }
        })
        index += 1

    # Coding Questions — as long-answer text
    for coding in assessment.get("coding", []):
        items.append({
            "createItem": {
                "item": {
                    "title": f"[Coding - {coding.get('difficulty', 'Medium')}] {coding.get('title', '')}",
                    "description": coding.get("description", ""),
                    "questionItem": {
                        "question": {
                            "required": True,
                            "textQuestion": {"paragraph": True}
                        }
                    }
                },
                "location": {"index": index}
            }
        })
        index += 1

    # Real-world Task — as long-answer text
    for task in assessment.get("task", []):
        items.append({
            "createItem": {
                "item": {
                    "title": f"[Real-world Task] {task.get('title', '')}",
                    "description": f"{task.get('description', '')}\n\nExpected Outcome: {task.get('expected_outcome', '')}",
                    "questionItem": {
                        "question": {
                            "required": True,
                            "textQuestion": {"paragraph": True}
                        }
                    }
                },
                "location": {"index": index}
            }
        })
        index += 1

    return items


if __name__ == "__main__":
    # Provides a manual way to authenticate and generate the token.json config file
    authenticate_manually()
