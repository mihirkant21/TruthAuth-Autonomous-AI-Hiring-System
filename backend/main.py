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

@app.post("/candidates/{candidate_id}/submit-task")
def submit_task(candidate_id: int, background_tasks: BackgroundTasks, task_submission: str = Form(...), db: Session = Depends(database.get_db)):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c or c.stage != models.CandidateStage.SCREENED:
        raise HTTPException(status_code=400, detail="Candidate not at Task stage")
        
    c.observed_data = {"submission": task_submission}
    c.stage = models.CandidateStage.TASK_COMPLETED
    db.query(models.Candidate).filter(models.Candidate.id == candidate_id).update({"observed_data": c.observed_data, "stage": c.stage})
    db.commit()
    background_tasks.add_task(orchestrator.run_pipeline, database.SessionLocal(), c.job_id)
    return {"message": "Task submitted successfully"}

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
