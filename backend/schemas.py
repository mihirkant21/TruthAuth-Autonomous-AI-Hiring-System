from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    skills: str
    experience: str

class JobResponse(JobCreate):
    id: int
    generated_jd: Optional[str] = None
    class Config:
        from_attributes = True

class CandidateCreate(BaseModel):
    name: str
    cv_text: str

class CandidateResponse(BaseModel):
    id: int
    job_id: int
    name: str
    stage: str
    created_at: Optional[datetime] = None
    claimed_data: Optional[Dict[str, Any]] = None
    observed_data: Optional[Dict[str, Any]] = None
    interview_transcript: Optional[str] = None
    scores: Optional[Dict[str, Any]] = None
    verdict: Optional[str] = None
    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    agent_name: str
    payload_in: Optional[Dict[str, Any]] = None
    payload_out: Optional[Dict[str, Any]] = None
    timestamp: datetime
    reason: Optional[str] = None
    class Config:
        from_attributes = True
