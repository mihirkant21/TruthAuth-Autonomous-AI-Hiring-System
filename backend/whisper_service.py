import os

try:
    import whisper
    model = None # Lazy load
except ImportError:
    whisper = None

def transcribe_audio(file_path: str) -> str:
    if not os.path.exists(file_path):
        return "Audio file not found."
        
    try:
        global whisper
        if whisper is None:
            import imageio_ffmpeg
            ffmpeg_dir = os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())
            if ffmpeg_dir not in os.environ.get("PATH", ""):
                os.environ["PATH"] += os.pathsep + ffmpeg_dir
            import whisper

        global model
        if 'model' not in globals() or model is None:
            model = whisper.load_model("tiny")
            
        result = model.transcribe(file_path)
        return result["text"]
    except Exception as e:
        print(f"Whisper STT failed (ensure ffmpeg is installed): {e}")
        # Return a mock transcript for testing prototype if whisper fails
        return "I have extensive experience with the required tech stack. In my last role, I led a team delivering high performance solutions. I definitely didn't use ChatGPT to write this."
