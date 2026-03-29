# TruthAuth — Zero-Trust Autonomous AI Hiring System

TruthAuth is a fully autonomous, multi-agent AI hiring system designed with a "Zero-Trust" philosophy. Rather than simply evaluating candidates based on what they claim in their resume, TruthAuth orchestrates multiple AI agents to independently cross-reference the candidate's initial claims against real-world technical task submissions and Whisper-transcribed behavioral interview media. 

By comparing data across all stages of the applicant's lifecycle, the **Core Truth Verifier AI** autonomously detects inconsistencies, skill exaggerations, and lies, assigning a definitive verification verdict.

---

## 🚀 Key Features

* **End-to-End Autonomy:** Candidates automatically advance through the pipeline simply by interacting with the Candidate Portal. Background tasks on the backend continually execute the necessary LLM inferences across all 8 stages of the hiring funnel as soon as new data is uploaded.
* **100% Local Multi-Agent Architecture:** All heavy LLM lifting is executed using **local hardware** via Ollama (using `glm4` and `qwen2.5:3b` models). This guarantees that proprietary hiring data and applicant credentials are completely secure and never routed to external APIs like OpenAI.
* **Dynamic Assessment Generation:** Automatically creates personalized MCQs and practical coding/scenario tasks strictly based on the applicant's extracted CV skills.
* **Vocal Truth Analysis:** Includes local implementation of OpenAI Whisper, automatically transcribing candidate audio/video submissions to validate conversational competency and detect behavioral contradictions.
* **Dossier Generation:** Automatically generates a beautiful, comprehensive PDF dossier outlining the candidate's matched skills, graded tasks, transcript insights, and discovered inconsistencies for HR review.

---

## 🧠 The Agent Matrix

TruthAuth utilizes a strictly typed, JSON-enforced AI array orchestrated by FastAPI background tasks:

1. **The JD Generator:** Autonomously constructs highly-detailed technical Job Descriptions based on minimal HR inputs or uploaded requirement PDFs.
2. **The Resume Extractor:** Ingests raw unstructured text (CVs/LinkedIn profiles) and synthesizes it into a highly structured claimed skill matrix.
3. **The Pre-Filter Gatecheck:** Performs an immediate hard-check of absolute minimum criteria against the CV before wasting compute.
4. **The CV Screener:** Conducts viability checks comparing Extracted Claims against the generated JD. Includes self-correction logic to relax matching threshold requirements if the candidate pool is exhausted.
5. **The Assessment Generator:** Dynamically creates targeted MCQs and coding/situational tasks tailored strictly to the skills the candidate listed.
6. **The Task Evaluator:** Auto-grades multiple choice questions and uses AI to analyze submitted free-form tasks/code against the expected output.
7. **The Interview Generator:** Formulates a personalized behavioral video prompt based on the candidate's JD and listed skills.
8. **The Core Truth Verifier (Zero-Trust Model):** The final evaluation node. It triangulates the extracted resume claims, the task evaluation score, and the transcribed interview audio to detect contradictions, yielding a final verification verdict (`hire` or `reject`).

---

## 🔄 Candidate Workflow Stages
The database models enforce a strict timeline of stages:
`NEW` → `EXTRACTED` → `SCREENED` → `TASK_ASSIGNED` → `TASK_COMPLETED` → `INTERVIEWED` → `TRUTH_VERIFIED` → `HIRED` / `REJECTED`

---

## 🛠️ Technology Stack

### Application & Rendering
* **Frontend Framework:** Next.js (App Router)
* **Styling Engine:** Tailwind CSS v4
* **Components:** React (CandidatePortal, JobForm, etc.)

### Backend Infrastructure
* **Core Framework:** Python FastAPI
* **Database & ORM:** SQLite via SQLAlchemy
* **Data Validation:** Pydantic
* **Asynchronous Automation:** FastAPI `BackgroundTasks`
* **Parsing:** `PyPDF2` / PDF extractions

### Artificial Intelligence & Machine Learning
* **Language Model Environment:** Ollama
* **Primary LLMs:** `glm4` (general evaluation) & `qwen2.5:3b` (dynamic assessment)
* **Speech-to-Text (STT):** `openai-whisper`
* **Dossier Compilation:** `reportlab` (Automated PDF timeline generation)

---

## ⚙️ Setup & Installation

### 1. Install & Start Ollama

Ollama must be running locally for the agents to work.

```bash
# Ensure Ollama is installed on your local machine
ollama run glm4
ollama run qwen2.5:3b
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```
> **Note:** The backend requires `ffmpeg` to be installed on your system path for Whisper to process video/audio files correctly.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## 🖥️ System Interfaces

The application logic naturally isolates operations into two primary views/experiences:
* **The HR Dashboard**: The Command Center. Allows recruiters to initialize jobs (with or without requirements PDFs), monitor the pipeline, inspect AI audit logs/evaluations in real-time, override agent decisions, and download verified truth dossiers.
* **The Candidate Portal**: The Applicant Node. An interactive environment where applicants browse jobs, upload credentials, complete dynamic AI-generated coding/MCQ tasks, and record/upload behavioral video verifications.
