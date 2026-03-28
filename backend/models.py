from sqlalchemy import Column, Integer, String, Float, Text, Enum, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    skills = Column(String)
    experience = Column(String)
    generated_jd = Column(Text, nullable=True)
    candidates = relationship("Candidate", back_populates="job")

class CandidateStage(str, enum.Enum):
    NEW = "NEW"
    EXTRACTED = "EXTRACTED"
    SCREENED = "SCREENED"
    TASK_ASSIGNED = "TASK_ASSIGNED"
    TASK_COMPLETED = "TASK_COMPLETED"
    INTERVIEWED = "INTERVIEWED"
    TRUTH_VERIFIED = "TRUTH_VERIFIED"
    HIRED = "HIRED"
    REJECTED = "REJECTED"

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    name = Column(String)
    cv_text = Column(Text)
    stage = Column(Enum(CandidateStage), default=CandidateStage.NEW)
    
    claimed_data = Column(JSON, nullable=True)
    observed_data = Column(JSON, nullable=True)
    interview_transcript = Column(Text, nullable=True)
    
    scores = Column(JSON, nullable=True)
    verdict = Column(String, nullable=True)
    report_url = Column(String, nullable=True)
    
    job = relationship("Job", back_populates="candidates")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String, index=True)
    payload_in = Column(JSON, nullable=True)
    payload_out = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    reason = Column(String, nullable=True)
