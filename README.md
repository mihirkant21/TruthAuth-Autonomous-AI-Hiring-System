# TruthAuth — Zero-Trust Autonomous AI Hiring System

TruthAuth is a fully autonomous, multi-agent AI hiring pipeline built with a **Zero-Trust** philosophy. Instead of trusting what a candidate claims on their resume, TruthAuth deploys a coordinated swarm of locally-running AI agents to independently verify those claims at every stage — from CV screening through technical assessment, behavioral interview, and final truth verification.

The system's **Core Truth Verifier** cross-references resume claims, coding task submissions, and a live-captured interview transcript to detect inconsistencies, score honesty, and autonomously decide whether to hire or reject — all without an HR person needing to intervene.

---

## 🚀 Key Features

- **Full End-to-End Pipeline Automation** — Candidates move through 9 distinct stages (`NEW → EXTRACTED → SCREENED → TASK_COMPLETED → INTERVIEWED → HIRED / REJECTED`) entirely through their own interactions. Backend background tasks fire the right AI agents at each transition.
- **100% Local LLM Stack** — All AI inference runs locally via [Ollama](https://ollama.com). No candidate data ever leaves the machine. The pipeline uses **3 different local models** for different tasks based on their strengths (`gemma3:4b`, `qwen2.5:3b`, `tinyllama:1.1b`).
- **Self-Correcting Screening** — If the entire candidate pool fails CV screening, the Orchestrator automatically relaxes criteria (+20 score boost) and re-runs the screener rather than leaving the pipeline empty.
- **Dynamic Personalized Assessments** — The Assessment Generator dynamically creates skill-specific MCQs, coding/case-study challenges, and a real-world take-home task tailored to each candidate's extracted skill profile (Beginner / Intermediate / Advanced).
- **Dual-Layer Interview Transcription** — The system attempts transcription via **OpenAI Whisper** locally. If Whisper fails or returns a fallback mock string, the system automatically falls back to the **Web Speech API** live transcript captured in the browser during recording — guaranteeing the HR dashboard and generated PDF always contain what the candidate actually said.
- **Live Captioning in Candidate Portal** — Real-time scrolling transcript appears on screen while the candidate speaks. Speech recognition auto-restarts if the browser stops listening due to pauses, ensuring the full 3-minute answer is captured.
- **PDF Dossier Generation** — On demand, HR can download a full candidate report containing screener scores, MCQ results, code snippet answers, portfolio/repo links, and the complete interview transcript.
- **Google Forms Integration** — After assessment generation, questions are optionally pushed to a configured Google Form via the Forms API (requires `credentials.json` + OAuth2 `token.json`).
- **Audit Log Feed** — Every agent invocation is logged with its input/output payload, enabling full traceability of AI decisions.

---

## 🧠 Agent Matrix

All agents are in `backend/agents/`. Each calls the local Ollama API via `ollama_client.py`.

| Agent | Model Used | Purpose |
|---|---|---|
| `jd_generator.py` | `qwen2.5:3b` | Generates full Job Descriptions from a job title, required skills, and experience level |
| `resume_extractor.py` | `gemma3:4b` | Parses raw CV text into structured JSON: `{name, skills[], experience, experience_years, tools[]}` |
| `pre_filter.py` | `tinyllama:1.1b` | Fast boolean gatecheck (40-point threshold). Weighs skills 70%, experience 15%, other 15% |
| `cv_screener.py` | `qwen2.5:3b` | Semantic skill matching against JD. Scores skills 50%, experience 30%, tools 20%. Threshold: 65% to advance |
| `assessment_generator.py` | `qwen2.5:3b` | Generates 3 MCQs, 2 practical challenges, 1 real-world task — all specific to the candidate's skills |
| `interview_generator.py` | `qwen2.5:3b` | Creates one deep, domain-specific 3-minute verbal scenario question |
| `task_intelligence.py` | `qwen2.5:3b` | Evaluates task submission against claimed skills; returns `task_score`, `consistency`, `completion` |
| `truth_verifier.py` | `qwen2.5:3b` | Final cross-reference of claims vs. task performance vs. interview transcript. Returns `truth_score`, `inconsistencies[]`, `decision` (hire/reject), `confidence_score` |

---

## 🔄 Pipeline Stages & Orchestration

The `orchestrator.py` `run_pipeline()` function executes as a FastAPI background task and walks all candidates for a given job through 4 sequential passes:

```
1. Extraction Pass      — Resume Extractor → stage: EXTRACTED
2. Screening Pass       — Pre-Filter Gate → CV Screener → stage: SCREENED or REJECTED
   └─ Self-Correction   — If nobody passes, relax criteria and re-screen
3. Task Evaluation      — Task Intelligence → stage: INTERVIEWED (awaiting video)
4. Truth Verification   — Truth Verifier → stage: HIRED or REJECTED
```

The pipeline is **triggered automatically** after:
- A candidate uploads their CV (`/candidates/upload-cv/`)
- A candidate submits their assessment (`/candidates/{id}/submit-task`)
- A candidate uploads their interview audio (`/candidates/{id}/upload-video`)
- HR manually clicks "Execute AI Agents" in the dashboard

---

## 🛠️ Technology Stack

### Frontend (`frontend/`)
| Technology | Role |
|---|---|
| **Next.js 14** (App Router) | React framework, file-based routing |
| **Tailwind CSS** | Utility-based styling |
| **Lucide React** | Icon library |
| **Axios** | HTTP client for all API calls |
| **Web Speech API** | Live browser-side speech-to-text during interview recording |
| **localStorage** | Persists candidate's own application list across page refreshes |

**Pages:**
- `/` — Landing page with role selection (HR Admin / Candidate)
- `/hr-dashboard` — HR command center: job creation, Kanban pipeline, candidate tracker, audit log
- `/candidate-portal` — Candidate-facing: job listings, application tracking, full assessment + interview flow

### Backend (`backend/`)
| Technology | Role |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM for SQLite database |
| **SQLite** | Local database (`hiring_db.db`) |
| **Pydantic v2** | Request/response schema validation |
| **openai-whisper** | Local speech-to-text for interview audio files |
| **reportlab** | PDF dossier generation |
| **PyPDF2** | PDF text extraction from uploaded CVs and requirement docs |
| **Google API Client** | Push assessments to Google Forms |
| **python-dotenv** | Environment variable management |

---

## ⚙️ Setup & Installation

### 1. Install & Start Ollama

Ollama must be running locally for the agents to work.

```bash
# Install Ollama from https://ollama.com
# Pull the required models:
ollama pull qwen2.5:3b
ollama pull gemma3:4b
ollama pull tinyllama:1.1b
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

> **FFmpeg Required:** Whisper needs FFmpeg installed on your system PATH to process audio files. If it's missing, the system automatically falls back to the browser-captured transcript sent in the form body.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## 🔑 Environment Variables

Create a `.env` file inside `backend/` (see `.env.example`):

```env
OLLAMA_URL=http://localhost:11434/api/generate
MODEL_NAME=qwen2.5:3b
GOOGLE_FORM_ID=           # Optional: your Google Form ID for assessment push
```

### Google Forms Setup (Optional)

1. Create an OAuth2 credential in Google Cloud Console and download `credentials.json` → place in `backend/`
2. Run `python backend/google_forms_service.py` once to complete browser-based auth and generate `token.json`
3. Set `GOOGLE_FORM_ID` in `.env`

If not configured, the system stores assessments in the local database only.

---

## 🖥️ Application Interfaces

### HR Dashboard (`/hr-dashboard`)
- **Dashboard Tab** — Create jobs (with optional PDF requirements upload), view active Kanban board per job, manually trigger AI pipeline execution, approve/reject/delete candidates, download PDF reports
- **Candidates Tab** — Full candidate tracker showing all candidates past the `NEW` stage, expandable to see recorded interview transcript and project submission details. Includes a "Re-transcribe" button to force Whisper re-processing of an uploaded audio file

### Candidate Portal (`/candidate-portal`)
- **Job Openings** — Browse all available jobs with their AI-generated JD previews
- **Apply** — Upload CV (auto-extracts name/skills/experience via AI), submit application
- **Assessment** — Answer AI-generated MCQs, write code/case study answers, submit portfolio link
- **Interview Stage** — Read the AI-generated scenario question, record a 3-minute verbal response with live real-time transcription shown on screen
- **My Applications** — Track all submitted applications with stage progress bar (persisted in localStorage)

---

## 📁 Project Structure

```
ET/
├── backend/
│   ├── agents/
│   │   ├── ollama_client.py        # Shared Ollama HTTP client (generate_text + generate_json)
│   │   ├── jd_generator.py         # Job Description generation
│   │   ├── resume_extractor.py     # CV → structured JSON (gemma3:4b)
│   │   ├── pre_filter.py           # Fast gatecheck (tinyllama:1.1b)
│   │   ├── cv_screener.py          # Semantic CV vs JD scoring
│   │   ├── assessment_generator.py # MCQ + practical + task generation
│   │   ├── interview_generator.py  # Personalized interview question
│   │   ├── task_intelligence.py    # Task submission evaluation
│   │   └── truth_verifier.py       # Final cross-reference verdict
│   ├── main.py                     # FastAPI routes
│   ├── orchestrator.py             # Multi-agent pipeline runner
│   ├── models.py                   # SQLAlchemy models + CandidateStage enum
│   ├── schemas.py                  # Pydantic request/response schemas
│   ├── database.py                 # SQLite engine + session
│   ├── whisper_service.py          # Local Whisper STT with fallback
│   ├── pdf_generator.py            # reportlab PDF dossier
│   ├── pdf_extractor.py            # PyPDF2 CV text extraction
│   ├── google_forms_service.py     # Google Forms API push
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                    # Landing page
│       │   ├── hr-dashboard/page.tsx       # HR command center
│       │   └── candidate-portal/page.tsx   # Candidate-facing portal
│       └── components/
│           ├── CandidatePortal.tsx         # Full candidate workflow component
│           ├── KanbanBoard.tsx             # HR pipeline Kanban view
│           ├── JobForm.tsx                 # HR job creation form
│           └── AuditLogFeed.tsx            # Real-time agent audit log
└── README.md
```
