# TruthAuth: Zero-Trust Autonomous AI Hiring System

TruthAuth is a fully autonomous, multi-agent AI hiring system designed with a "Zero-Trust" philosophy. Rather than simply evaluating candidates based on what they claim in their resume, TruthAuth orchestrates multiple AI agents to independently cross-reference the candidate's initial claims against real-world technical task submissions and Whisper-transcribed behavioral interview media. 

By comparing data across all stages of the applicant's lifecycle, the **Core Truth Verifier AI** autonomously detects inconsistencies, skill exaggerations, and lies, assigning a definitive "Truth Score."

---

## 🚀 Core Features

* **End-to-End Autonomy:** Candidates automatically advance through the pipeline simply by interacting with the Candidate Portal. Background tasks on the backend continually execute the necessary LLM inferences as soon as new data is uploaded.
* **100% Local Multi-Agent Architecture:** All heavy LLM lifting is executed using **local hardware** via Ollama (`glm4` model). This guarantees that proprietary hiring data and applicant credentials are completely secure and are never routed to external APIs like OpenAI.
* **Vocal Truth Analysis:** Includes local implementation of OpenAI Whisper, automatically transcribing candidate audio/video submissions to validate conversational competency and detect behavioral contradictions.
* **Dossier Generation:** Automatically generates a comprehensive PDF dossier outlining the candidate's Truth Score and discovered inconsistencies for HR review.
* **Enterprise Interface:** A highly polished, custom dark-teal thematic dashboard combining modern flat design concepts with dense data visualization panels.

---

## 🧠 The Agent Matrix

TruthAuth utilizes a strictly typed, JSON-enforced AI array orchestrated by FastAPI background tasks:

1. **The JD Generator:** Autonomously constructs highly-detailed technical Job Descriptions based on minimal HR inputs.
2. **The Resume Extractor:** Ingests raw unstructured text (CVs/LinkedIn profiles) and synthesizes it into a highly structured skill matrix.
3. **The CV Screener:** Conducts initial viability checks comparing Extracted Claims against the generated JD. Includes self-correction logic to relax requirements if the candidate pool is fully exhausted.
4. **The Task Evaluator:** Analyzes actual GitHub repositories, PRs, or raw code blocks submitted by the candidate to determine actual implementation capacity.
5. **The Core Truth Verifier (Zero-Trust Model):** The final evaluation node. It compares the extracted resume claims, the task evaluation score, and the transcribed interview audio to detect contradictions, yielding a final verification verdict (`hire` or `reject`).

---

## 🛠️ Technology Stack

### Application & Rendering
* **Frontend Framework:** Next.js (App Router)
* **Styling Engine:** Tailwind CSS v4
* **Animations & Micro-interactions:** Framer Motion
* **Iconography:** Lucide React

### Backend Infrastructure
* **Core Framework:** Python FastAPI
* **Database & ORM:** SQLite via SQLAlchemy
* **Data Validation:** Pydantic
* **Asynchronous Automation:** FastAPI `BackgroundTasks`

### Artificial Intelligence & Machine Learning
* **Language Model Environment:** Ollama
* **Primary LLM:** GLM-4 (Chosen for exceptional complex JSON adherence)
* **Speech-to-Text (STT):** `openai-whisper`
* **Dossier Compilation:** `reportlab` (PDF generation)

---

## ⚙️ Installation & Setup

### 1. Artificial Intelligence Node (Ollama)
You must have the local Ollama daemon running to power the agents.
```bash
# Ensure Ollama is installed on your local machine
ollama run glm4
```

### 2. Backend Environment (Python)
Navigate to the `backend` directory.
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies (Requires FFmpeg for Whisper)
pip install -r requirements.txt

# Boot the FastAPI Server
uvicorn main:app --reload --port 8000
```
> **Note:** The backend requires `ffmpeg` to be installed on your system path for Whisper to process video/audio files correctly. A fallback is coded into the STT module for environments missing it.

### 3. Frontend Environment (Next.js)
Navigate to the `frontend` directory.
```bash
cd frontend
npm install

# Boot the Next.js UI Server
npm run dev
```

---

## 🖥️ System Interfaces

The application utilizes two strictly isolated routing environments:
* **`/hr-dashboard`**: The HR Command Center. Allows recruiters to initialize arrays (Jobs), monitor the Kanban pipeline, inspect AI evaluations in real time, and download verified truth dossiers.
* **`/candidate-portal`**: The Applicant Node. A complex stepper environment where applicants upload credentials, execute coding tasks, and provide vocal verifications without HR intervention.
