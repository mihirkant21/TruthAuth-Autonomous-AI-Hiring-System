from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def generate_report(candidate_name: str, scores: dict, verdict: str) -> str:
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)
    
    c_name = str(candidate_name) if candidate_name else "Candidate"
    filename = f"{c_name.replace(' ', '_')}_Truth_Report.pdf"
    filepath = os.path.join(reports_dir, filename)
    
    c = canvas.Canvas(filepath, pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, f"Truth-Verified Evaluation Report: {c_name}")
    
    c.setFont("Helvetica", 12)
    y = 710
    
    v_str = str(verdict).upper() if verdict else "UNKNOWN"
    c.drawString(100, y, f"Final AI Hiring Verdict: {v_str}")
    y -= 30
    
    c.drawString(100, y, "--- Screener Evaluation ---")
    y -= 20
    screener = scores.get("screener", {})
    c.drawString(100, y, f"Screener Score: {screener.get('score', 'N/A')}")
    y -= 30
    
    c.drawString(100, y, "--- Task Intelligence Validation ---")
    y -= 20
    task = scores.get("task", {})
    c.drawString(100, y, f"Task Score: {task.get('task_score', 'N/A')}")
    c.drawString(100, y-15, f"Consistency: {str(task.get('consistency', ''))[:80]}...")
    y -= 45
    
    truth = scores.get("truth", {})
    c.setFillColorRGB(0.8, 0, 0)
    c.drawString(100, y, "=== TRUTH VERIFICATION ANALYSIS ===")
    c.setFillColorRGB(0, 0, 0)
    y -= 20
    c.drawString(100, y, f"Truth Core Score: {truth.get('truth_score', 'N/A')} / 10")
    c.drawString(100, y-15, f"AI Confidence: {truth.get('confidence_score', 'N/A')}%")
    y -= 35
    
    reason = str(truth.get('reason', ''))
    c.drawString(100, y, f"Verdict Reason: {reason[:80]}")
    if len(reason) > 80:
        c.drawString(100, y-15, f"{reason[80:160]}...")
    
    c.save()
    return filepath
