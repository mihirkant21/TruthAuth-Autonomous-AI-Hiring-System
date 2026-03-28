import json
from sqlalchemy.orm import Session
import models
from agents import resume_extractor, cv_screener, task_intelligence, truth_verifier

def log_audit(db: Session, agent_name: str, payload_in: dict, payload_out: dict, reason: str = None):
    log = models.AuditLog(
        agent_name=agent_name,
        payload_in=payload_in,
        payload_out=payload_out,
        reason=reason
    )
    db.add(log)
    db.commit()

def run_pipeline(db: Session, job_id: int):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        return

    candidates = db.query(models.Candidate).filter(models.Candidate.job_id == job_id).all()
    if not candidates:
        return
        
    relaxed_criteria = False
    
    # 1. Extraction Pass
    for c in candidates:
        if c.stage == models.CandidateStage.NEW:
            extract_out = resume_extractor.extract_resume(c.cv_text)
            c.claimed_data = extract_out
            c.stage = models.CandidateStage.EXTRACTED
            log_audit(db, "Resume Extractor", {"cv_text": c.cv_text[:100]}, extract_out)
            db.commit()

    # 2. Screening Pass
    for c in candidates:
        if c.stage == models.CandidateStage.EXTRACTED:
            from agents import pre_filter
            pre_filter_out = pre_filter.pre_filter_cv(job.generated_jd, c.claimed_data or {})
            log_audit(db, "Pre-Filter Gate", {"claimed": c.claimed_data}, pre_filter_out)
            
            if not pre_filter_out.get("pass", False):
                c.stage = models.CandidateStage.REJECTED
                c.verdict = f"Failed Pre-Filter: {pre_filter_out.get('reason', 'Missing minimum requirements')}"
                db.query(models.Candidate).filter(models.Candidate.id == c.id).update({"stage": c.stage, "verdict": c.verdict})
                db.commit()
                continue
                
            # First pass
            screen_out = cv_screener.screen_cv(job.generated_jd, c.claimed_data or {}, relaxed=False)
            scores = c.scores or {}
            scores["screener"] = screen_out
            c.scores = scores
            if screen_out.get("decision") == "advance" or screen_out.get("decision") == "advance":
                c.stage = models.CandidateStage.SCREENED # Wait for task
            else:
                c.stage = models.CandidateStage.REJECTED
                c.verdict = "Rejected at Screening"
            log_audit(db, "CV Screener", {"job": job.title, "claimed": c.claimed_data}, screen_out)
            db.query(models.Candidate).filter(models.Candidate.id == c.id).update({"scores": c.scores, "stage": c.stage, "verdict": c.verdict})
            db.commit()

    # Self-Correction Check
    still_active = [c for c in candidates if c.stage in [models.CandidateStage.SCREENED, models.CandidateStage.TASK_COMPLETED]]
    if not still_active and candidates:
        log_audit(db, "Orchestrator", {"event": "check_pipeline"}, {"action": "relax_criteria"}, "Pipeline stalled, no candidates passed screening")
        for c in candidates:
            if c.stage == models.CandidateStage.REJECTED and c.verdict == "Rejected at Screening":
                screen_out = cv_screener.screen_cv(job.generated_jd, c.claimed_data or {}, relaxed=True)
                scores = c.scores or {}
                scores["screener_relaxed"] = screen_out
                c.scores = scores
                if screen_out.get("decision") == "advance":
                    c.stage = models.CandidateStage.SCREENED
                    c.verdict = None
                log_audit(db, "CV Screener (Relaxed)", {"job": job.title, "claimed": c.claimed_data}, screen_out)
                db.query(models.Candidate).filter(models.Candidate.id == c.id).update({"scores": c.scores, "stage": c.stage, "verdict": c.verdict})
                db.commit()

    # 3. Task Evaluation (if TASK_COMPLETED)
    for c in candidates:
        if c.stage == models.CandidateStage.TASK_COMPLETED:
            task_out = task_intelligence.evaluate_task(c.claimed_data or {}, c.observed_data.get("submission", "") if c.observed_data else "")
            
            c.scores = c.scores or {}
            c.scores["task"] = task_out
            c.stage = models.CandidateStage.INTERVIEWED # Moving forward awaiting interview video
            log_audit(db, "Task Intelligence", {"claimed": c.claimed_data, "observed": c.observed_data}, task_out)
            db.query(models.Candidate).filter(models.Candidate.id == c.id).update({"scores": c.scores, "stage": c.stage})
            db.commit()

    # 4. Truth Verification (if INTERVIEWED and has transcript)
    for c in candidates:
        if c.stage == models.CandidateStage.INTERVIEWED and c.interview_transcript:
            truth_out = truth_verifier.verify_truth(c.claimed_data or {}, c.scores.get("task", {}), c.interview_transcript)
            
            c.scores = c.scores or {}
            c.scores["truth"] = truth_out
            
            c.verdict = truth_out.get("decision", "reject")
            if c.verdict == "hire":
                c.stage = models.CandidateStage.HIRED
            else:
                c.stage = models.CandidateStage.REJECTED
                
            log_audit(db, "Truth Verifier API", 
                 {"claims": c.claimed_data, "task": c.scores.get("task", {}), "transcript": c.interview_transcript}, 
                 truth_out, "Core Truth Analysis")
            
            db.query(models.Candidate).filter(models.Candidate.id == c.id).update({
                "scores": c.scores, 
                "stage": c.stage, 
                "verdict": c.verdict
            })
            db.commit()
