from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

import textwrap

def generate_report(candidate_name: str, scores: dict, verdict: str, observed_data: dict = None, interview_transcript: str = None) -> str:
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
    y -= 40
    
    if observed_data:
        task_url = observed_data.get('task_url')
        if task_url:
            if y < 100:
                c.showPage()
                y = 750
            c.setFont("Helvetica-Bold", 12)
            c.drawString(100, y, "--- Submitted Artifacts ---")
            y -= 20
            c.setFont("Helvetica", 10)
            c.drawString(100, y, f"Portfolio/Repo: {task_url}")
            y -= 30

        mcq_results = observed_data.get('mcq_results')
        if mcq_results and isinstance(mcq_results, list):
            if y < 150:
                c.showPage()
                y = 750
            c.setFont("Helvetica-Bold", 12)
            c.drawString(100, y, f"--- MCQ Evaluation --- Score: {observed_data.get('mcq_score', 'N/A')}")
            y -= 20
            c.setFont("Helvetica", 10)
            
            for i, res in enumerate(mcq_results):
                q = str(res.get('question', ''))
                cand = str(res.get('candidate_answer', ''))
                correct = res.get('is_correct', False)
                
                # Check pagination before long question block
                if y < 80:
                    c.showPage()
                    y = 750
                    c.setFont("Helvetica", 10)
                    
                lines = textwrap.wrap(f"Q{i+1}: {q}", width=80)
                for line in lines:
                    c.drawString(100, y, line)
                    y -= 15
                
                c.setFillColorRGB(0, 0.6, 0) if correct else c.setFillColorRGB(0.8, 0, 0)
                ans_str = f"Answer: {cand} [{'CORRECT' if correct else 'INCORRECT'}]"
                c.drawString(110, y, ans_str)
                c.setFillColorRGB(0, 0, 0)
                y -= 25

        code_answers = observed_data.get('code_answers')
        if code_answers and isinstance(code_answers, dict) and len(code_answers) > 0:
            if y < 150:
                c.showPage()
                y = 750
            c.setFont("Helvetica-Bold", 12)
            c.drawString(100, y, "--- Subjective / Code Snippet Evaluation ---")
            y -= 20
            c.setFont("Helvetica", 10)
            
            for k, v in code_answers.items():
                if y < 60:
                    c.showPage()
                    y = 750
                    c.setFont("Helvetica", 10)
                
                c.drawString(100, y, f"Snippet {int(k)+1}:")
                y -= 15
                
                lines = textwrap.wrap(str(v), width=80)
                for line in lines:
                    if y < 40:
                        c.showPage()
                        y = 750
                        c.setFont("Helvetica", 10)
                    c.drawString(110, y, line)
                    y -= 15
                y -= 15
            
    if interview_transcript:
        if y < 150:
            c.showPage()
            y = 750
        c.setFont("Helvetica-Bold", 12)
        c.drawString(100, y, "--- Recorded Auto-Transcript ---")
        y -= 20
        c.setFont("Helvetica", 10)
        
        lines = textwrap.wrap(interview_transcript, width=85)
        for line in lines:
            if y < 50:
                c.showPage()
                y = 750
                c.setFont("Helvetica", 10)
            c.drawString(100, y, line)
            y -= 15

    c.save()
    return filepath
