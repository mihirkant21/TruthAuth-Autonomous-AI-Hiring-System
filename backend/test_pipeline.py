import requests
import time
import os

BASE_URL = "http://localhost:8000"

def wait_for_stage(candidate_id, target_stage, job_id, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        res = requests.get(f"{BASE_URL}/candidates/{job_id}").json()
        c = next((c for c in res if c["id"] == candidate_id), None)
        print(f"Current stage: {c['stage']}")
        if c and c["stage"] == target_stage:
            return True
        time.sleep(5)
    return False

print("1. Creating Job")
res = requests.post(f"{BASE_URL}/jobs/", json={
    "title": "Senior AI Engineer AutoTest",
    "skills": "Python, FastAPI",
    "experience": "5+ years"
})
job = res.json()
print("Job created:", job["id"])

print("2. Adding Candidate (Should auto-trigger Extract & Screen)")
cv_text = "I am a Senior AI Engineer with 5 years experience."
res = requests.post(f"{BASE_URL}/candidates/?job_id={job['id']}", json={
    "name": "Jane Auto",
    "cv_text": cv_text
})
candidate = res.json()
print("Candidate created:", candidate["id"])

if wait_for_stage(candidate["id"], "SCREENED", job["id"]):
    print("Screened successfully.")
else:
    print("Failed to reach SCREENED stage automatically.")
    exit(1)

print("3. Submitting Task (Should auto-trigger Task Eval)")
requests.post(f"{BASE_URL}/candidates/{candidate['id']}/submit-task", data={
    "task_submission": "Here is my github repo link."
})

if wait_for_stage(candidate["id"], "INTERVIEWED", job["id"]):
    print("Evaluated task successfully. Waiting for interview.")
else:
    print("Failed to reach INTERVIEWED stage automatically.")
    exit(1)

print("4. Uploading dummy video (Should auto-trigger Truth Verifier)")
with open("dummy.mp4", "wb") as f:
    f.write(b"dummy")
with open("dummy.mp4", "rb") as f:
    requests.post(f"{BASE_URL}/candidates/{candidate['id']}/upload-video", files={"file": f})

if wait_for_stage(candidate["id"], "HIRED", job["id"]) or wait_for_stage(candidate["id"], "REJECTED", job["id"]):
    print("Truth Verification finished automatically.")
else:
    print("Failed to finish truth verification automatically.")
