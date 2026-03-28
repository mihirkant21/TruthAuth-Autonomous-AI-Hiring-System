from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database, models, schemas
import orchestrator
from pdf_generator import generate_report
import os
import shutil
from fastapi.responses import FileResponse
import whisper_service
from pdf_extractor import extract_text_from_pdf
from google_forms_service import push_to_forms
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Truth-Verified Hiring API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/jobs/", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(database.get_db)):
    db_job = models.Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    from agents import jd_generator
    jd_text = jd_generator.generate_jd(db_job.title, db_job.skills, db_job.experience)
    db_job.generated_jd = jd_text
    db.commit()
    
    return db_job

@app.get("/jobs/", response_model=list[schemas.JobResponse])
def get_jobs(db: Session = Depends(database.get_db)):
    return db.query(models.Job).all()

@app.post("/jobs/{job_id}/upload-requirements/", response_model=schemas.JobResponse)
def upload_job_requirements(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    skills_text = extract_text_from_pdf(file)
    
    from agents import jd_generator
    jd_text = jd_generator.generate_jd(job.title, skills_text, job.experience)
    
    job.skills = "From Uploaded PDF"
    job.generated_jd = jd_text
    db.commit()
    db.refresh(job)
    return job

@app.post("/candidates/", response_model=schemas.CandidateResponse)
def add_candidate(candidate: schemas.CandidateCreate, job_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    db_candidate = models.Candidate(**candidate.model_dump(), job_id=job_id)
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    background_tasks.add_task(orchestrator.run_pipeline, database.SessionLocal(), job_id)
    return db_candidate

@app.get("/candidates/{job_id}", response_model=list[schemas.CandidateResponse])
def get_candidates(job_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Candidate).filter(models.Candidate.job_id == job_id).all()

@app.post("/candidates/extract-cv-info/")
def extract_cv_info(file: UploadFile = File(...)):
    cv_text = extract_text_from_pdf(file)
    from agents import resume_extractor
    extracted_data = resume_extractor.extract_resume(cv_text)
    return extracted_data

@app.post("/candidates/upload-cv/")
def upload_candidate_cv(
    job_id: int = Form(...),
    name: str = Form(...),
    skills: str = Form(""),
    experience: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cv_text = extract_text_from_pdf(file)
    
    db_candidate = models.Candidate(name=name, cv_text=cv_text, job_id=job_id, stage=models.CandidateStage.NEW)
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)

    # Phase 2: CV Extraction using AI
    from agents import resume_extractor
    from agents import pre_filter
    from agents import cv_screener
    import orchestrator

    extract_out = resume_extractor.extract_resume(cv_text)
    # Ensure required fields have fallbacks
    if not extract_out.get("name"): extract_out["name"] = name
    if not extract_out.get("skills"): extract_out["skills"] = [s.strip() for s in skills.split(",") if s.strip()]
    
    db_candidate.claimed_data = extract_out
    db_candidate.stage = models.CandidateStage.EXTRACTED
    orchestrator.log_audit(db, "Resume Extractor", {"cv_text": cv_text[:100]}, extract_out)
    db.commit()

    # Phase 2.5: Pre-Filter Gatecheck
    pre_filter_out = pre_filter.pre_filter_cv(job.generated_jd, extract_out)
    orchestrator.log_audit(db, "Pre-Filter Gate", {"claimed": extract_out}, pre_filter_out)
    
    if not pre_filter_out.get("pass", False):
        db_candidate.stage = models.CandidateStage.REJECTED
        db_candidate.verdict = f"Failed Pre-Filter: {pre_filter_out.get('reason', 'Did not meet minimum requirements')}"
        db.commit()
        return {
            "status": "rejected",
            "message": db_candidate.verdict,
            "candidate": {"id": db_candidate.id, "name": db_candidate.name, "stage": db_candidate.stage}
        }

    # Phase 3: CV Screening
    screen_out = cv_screener.screen_cv(job.generated_jd, extract_out, relaxed=False)
    scores = db_candidate.scores or {}
    scores["screener"] = screen_out
    db_candidate.scores = scores

    match_percentage = screen_out.get("match_percentage", 0)
    
    db_candidate.stage = models.CandidateStage.SCREENED # Keep active unless deactivated by HR
    
    if match_percentage >= 65:
        db_candidate.verdict = f"Passed Screen ({match_percentage}%)"
        orchestrator.log_audit(db, "CV Screener (Sync)", {"job": job.title, "claimed": db_candidate.claimed_data}, screen_out)
        db.commit()

        # --- AI Assessment Generation ---
        from agents import assessment_generator
        assessment = assessment_generator.generate_assessment(extract_out)
        scores = db_candidate.scores or {}
        scores["assessment"] = assessment
        db_candidate.scores = scores
        db.query(models.Candidate).filter(models.Candidate.id == db_candidate.id).update({"scores": db_candidate.scores})
        db.commit()
        orchestrator.log_audit(db, "Assessment Generator", {"candidate": name, "level": extract_out}, {"candidate_level": assessment.get("candidate_level")})

        # --- Push to Google Forms (stub if not configured) ---
        forms_result = push_to_forms(assessment, db_candidate.id, db_candidate.name)

        return {
            "status": "accepted",
            "message": f"Candidate meets criteria (Match: {match_percentage}%)",
            "candidate": {"id": db_candidate.id, "name": db_candidate.name, "stage": db_candidate.stage},
            "assessment": assessment,
            "forms": forms_result
        }
    else:
        db_candidate.verdict = f"Failed Screen ({match_percentage}%)"
        orchestrator.log_audit(db, "CV Screener (Sync)", {"job": job.title, "claimed": db_candidate.claimed_data}, screen_out)
        db.commit()
        return {
            "status": "rejected",
            "message": f"You do not meet the criteria. Minimum 65% match required, but got {match_percentage}%.",
            "candidate": {"id": db_candidate.id, "name": db_candidate.name, "stage": db_candidate.stage}
        }

@app.post("/candidates/{candidate_id}/terminate")
def terminate_candidate(candidate_id: int, db: Session = Depends(database.get_db)):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
    c.stage = models.CandidateStage.REJECTED
    c.verdict = "Terminated by HR"
    db.commit()
    return {"message": "Candidate terminated"}

@app.post("/candidates/{candidate_id}/submit-task")
def submit_task(candidate_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db), task_submission: str = Form(""), mcq_answers: str = Form("{}"), code_answers: str = Form("{}"), task_url: str = Form("")):
    import json
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")

    try:
        mcq_parsed = json.loads(mcq_answers) if mcq_answers else {}
    except Exception:
        mcq_parsed = {}
    try:
        code_parsed = json.loads(code_answers) if code_answers else {}
    except Exception:
        code_parsed = {}

    # Auto-score MCQs against stored assessment
    scores = c.scores or {}
    assessment = scores.get("assessment", {})
    mcq_list = assessment.get("mcq", [])
    mcq_score = 0
    mcq_total = len(mcq_list)
    mcq_results = []
    for i, q in enumerate(mcq_list):
        candidate_ans = mcq_parsed.get(str(i), "")
        correct = q.get("answer", "")
        is_correct = candidate_ans.strip().lower() == correct.strip().lower()
        if is_correct:
            mcq_score += 1
        mcq_results.append({"question": q.get("question"), "candidate_answer": candidate_ans, "correct_answer": correct, "is_correct": is_correct})

    c.observed_data = {
        "submission": task_submission,
        "task_url": task_url,
        "mcq_answers": mcq_parsed,
        "code_answers": code_parsed,
        "mcq_results": mcq_results,
        "mcq_score": f"{mcq_score}/{mcq_total}"
    }
    c.stage = models.CandidateStage.TASK_COMPLETED
    db.query(models.Candidate).filter(models.Candidate.id == candidate_id).update({"observed_data": c.observed_data, "stage": c.stage})
    db.commit()
    background_tasks.add_task(orchestrator.run_pipeline, database.SessionLocal(), c.job_id)
    return {
        "message": "Assessment submitted successfully",
        "mcq_score": f"{mcq_score}/{mcq_total}",
        "mcq_results": mcq_results
    }

@app.post("/candidates/{candidate_id}/upload-video")
async def upload_video(candidate_id: int, background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c or c.stage != models.CandidateStage.INTERVIEWED:
        raise HTTPException(status_code=400, detail="Candidate not ready for interview upload")

    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    transcript = whisper_service.transcribe_audio(file_path)
    c.interview_transcript = transcript
    db.commit()
    background_tasks.add_task(orchestrator.run_pipeline, database.SessionLocal(), c.job_id)
    return {"transcript": transcript}

@app.post("/run-pipeline/{job_id}")
def trigger_pipeline(job_id: int, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    background_tasks.add_task(orchestrator.run_pipeline, database.SessionLocal(), job_id)
    return {"message": "Pipeline iteration started"}

@app.get("/audit-logs/", response_model=list[schemas.AuditLogResponse])
def get_audit_logs(db: Session = Depends(database.get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(50).all()

@app.get("/download-report/{candidate_id}")
def download_report(candidate_id: int, db: Session = Depends(database.get_db)):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    filepath = generate_report(candidate.name, candidate.scores or {}, candidate.verdict or "Unknown")
    return FileResponse(path=filepath, filename=os.path.basename(filepath), media_type='application/pdf')

@app.get("/candidates/{candidate_id}/assessment")
def get_assessment(candidate_id: int, db: Session = Depends(database.get_db)):
    """Returns the AI-generated assessment for a candidate (after passing CV screening)."""
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    scores = candidate.scores or {}
    assessment = scores.get("assessment")
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not yet generated for this candidate")
    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate.name,
        "candidate_level": assessment.get("candidate_level", "Intermediate"),
        "assessment": assessment
    }
