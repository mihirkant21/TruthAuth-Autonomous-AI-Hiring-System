# TruthAuth — Zero-Trust Autonomous AI Hiring System

TruthAuth is a fully autonomous, multi-agent AI hiring system designed with a "Zero-Trust" philosophy. Rather than simply evaluating candidates based on what they claim in their resume, TruthAuth orchestrates multiple AI agents to independently cross-reference the applicant's initial claims against real-world technical task submissions and Whisper-transcribed behavioral interview media. 

By comparing data across all stages of the applicant's lifecycle, the **Core Truth Verifier AI** autonomously detects inconsistencies, skill exaggerations, and lies, assigning a definitive verification verdict.

---

## 🚀 Key Features

* **End-to-End Autonomy:** Candidates automatically advance through the pipeline simply by interacting with the Candidate Portal. Background tasks on the backend continually execute the necessary LLM inferences across all 8 stages of the hiring funnel.
* **100% Local Multi-Agent Architecture:** All heavy LLM lifting is executed using **local hardware** via Ollama (using `glm4` and `qwen2.5:3b` models). This guarantees proprietary hiring data and applicant credentials are secure.
* **Dynamic Assessment Generation:** Automatically creates personalized MCQs and practical coding/scenario tasks strictly based on the applicant's extracted CV skills.
* **Vocal Truth Analysis:** Includes local implementation of OpenAI Whisper, automatically transcribing candidate audio/video submissions to validate conversational competency and detect behavioral contradictions.
* **Automated PDF Dossiers:** Generates a beautiful, comprehensive PDF dossier outlining the candidate's matched skills, graded tasks, transcript insights, and discovered inconsistencies for HR review.

---

## 🧠 The Agent Matrix

TruthAuth utilizes a strictly typed, JSON-enforced AI array orchestrated by FastAPI background tasks:

1. **The JD Generator:** Autonomously constructs highly-detailed technical Job Descriptions based on minimal HR inputs or uploaded requirement PDFs.
2. **The Resume Extractor:** Ingests unstructured text (CVs/LinkedIn profiles) and synthesizes it into a highly structured claimed skill matrix.
3. **The Pre-Filter Gatecheck:** Performs an immediate hard-check of absolute minimum criteria against the CV before wasting further compute.
4. **The CV Screener:** Conducts viability checks comparing Extracted Claims against the generated JD. Includes self-correction logic to relax matching threshold requirements if the candidate pool is exhausted.
5. **The Assessment Generator:** Dynamically creates targeted MCQs and coding/situational tasks tailored strictly to the skills the candidate listed (`qwen2.5:3b`).
6. **The Task Evaluator:** Auto-grades multiple choice questions and uses AI to analyze submitted free-form tasks against expected outcomes.
7. **The Interview Generator:** Formulates a personalized behavioral video prompt based on the candidate's JD and listed skills.
8. **The Core Truth Verifier (Zero-Trust Model):** The final evaluation node. It triangulates the extracted resume claims, the task evaluation score, and the transcribed interview audio to detect contradictions, yielding a final verdict (`hire` or `reject`).

---

## 🔄 Candidate Workflow Pipeline

The system enforces a strict state-machine timeline of stages for every candidate:

1. **`NEW`**: The candidate uploads their CV PDF. Text is extracted.
2. **`EXTRACTED`**: The Resume Extractor parses the raw text into intelligent structured data (skills, experience, education).
3. **`SCREENED`**: The candidate passes the Pre-Filter Gatecheck and scores >= 65% match from the CV Screener. A custom task is generated.
4. **`TASK_ASSIGNED`**: The candidate triggers the dynamically generated assessment (MCQs + practical challenge).
5. **`TASK_COMPLETED`**: The candidate submits answers. Task Evaluator AI automatically grades the submission.
6. **`INTERVIEWED`**: The candidate uploads a video response to a personalized behavioral prompt. Whisper transcribes the audio.
7. **`TRUTH_VERIFIED`**: The Verifier AI cross-references the CV claims, the task submission, and the vocal transcript to find inconsistencies.
8. **`HIRED` / `REJECTED`**: A final verdict is rendered and a comprehensive PDF dossier is generated for HR.

---

## 📁 Project Folder Structure

```text
TruthAuth/
│
├── backend/                       # Python FastAPI Backend
│   ├── agents/                    # The Multi-Agent AI System
│   │   ├── assessment_generator.py  
│   │   ├── cv_screener.py         
│   │   ├── interview_generator.py 
│   │   ├── jd_generator.py        
│   │   ├── ollama_client.py       # Local LLM connection
│   │   ├── pre_filter.py          
│   │   ├── resume_extractor.py    
│   │   ├── task_intelligence.py   
│   │   └── truth_verifier.py      # Core Zero-Trust Logic
│   │
│   ├── reports/                   # Generated PDF Dossiers are saved here
│   ├── uploads/                   # Temporary candidate resume & video uploads
│   ├── database.py                # Database connection & migrations
│   ├── main.py                    # FastAPI root router and endpoints
│   ├── models.py                  # SQLAlchemy schema (Job, Candidate, AuditLog)
│   ├── orchestrator.py            # Async BackgroundTask state machine logic
│   ├── schemas.py                 # Pydantic validation schemas
│   ├── pdf_generator.py           # ReportLab PDF Dossier creation
│   └── whisper_service.py         # OpenAI Whisper local voice transcription
│
└── frontend/                      # Next.js Application Stack
    ├── src/
    │   ├── app/                   # App Router pages
    │   └── components/            # React UI Fragments
    │       ├── CandidatePortal.tsx  # Applicant-facing test portal
    │       └── JobForm.tsx          # HR Command Dashboard
    ├── public/                    # Static assets
    ├── package.json               # Node dependencies
    └── tailwind.config.ts         # PostCSS/Tailwind configuration
```

---

## 🛠️ Technology Stack

### Application & Rendering
* **Frontend Framework:** Next.js (App Router)
* **Styling Engine:** Tailwind CSS v4
* **Components:** React

### Backend Infrastructure
* **Core Framework:** Python FastAPI
* **Database & ORM:** SQLite via SQLAlchemy
* **Data Validation:** Pydantic
* **Asynchronous Automation:** FastAPI `BackgroundTasks`
* **Parsing:** `PyPDF2` (Document handling)

### Artificial Intelligence & Machine Learning
* **Language Model Environment:** Ollama
* **Primary LLMs:** `glm4` (default), `qwen2.5:3b` (generation & tasks), `gemma3:4b` (extraction), and `tinyllama:1.1b` (gatechecking).
* **Speech-to-Text (STT):** Local `openai-whisper`
* **Dossier Compilation:** `reportlab` (Automated PDF generation)

---

## ⚙️ Setup & Installation

### 1. Install & Start Ollama
Ollama must be running locally for the AI agents to execute. Ensure it's installed on your system.
```bash
ollama run glm4
ollama run qwen2.5:3b
ollama run gemma3:4b
ollama run tinyllama:1.1b
```

### 2. Configure Environment Variables
Inside the `backend/` directory, create a `.env` file referencing the `.env.example` structure:
```env
DATABASE_URL=sqlite:///./hiring_db.db
OLLAMA_URL=http://localhost:11434/api/generate
MODEL_NAME=glm4

# Google Forms integration (Optional)
GOOGLE_FORM_ID=your_google_form_id_here
GOOGLE_API_KEY=your_google_cloud_api_key_here
```

### 3. Backend Setup
```bash
cd backend
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

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The TruthAuth HR Command dashboard and Applicant portal will launch at `http://localhost:3000`.
