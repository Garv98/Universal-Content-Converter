import os
import tempfile
import json
from datetime import timedelta

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "")


def extract_audio_from_video(video_path, output_format="wav"):
    try:
        from moviepy import VideoFileClip
        
        print(f"🎬 Extracting audio from video: {video_path}")
        
        temp_audio_path = tempfile.mktemp(suffix=f'.{output_format}')
        
        video = VideoFileClip(video_path)
        audio = video.audio
        
        if audio is None:
            print("⚠️ No audio track found in video")
            video.close()
            return None, {"duration": video.duration, "has_audio": False}
        
        audio.write_audiofile(temp_audio_path)
        
        video_info = {
            "duration": video.duration,
            "has_audio": True,
            "fps": video.fps,
            "size": video.size,
            "audio_fps": audio.fps if audio else None
        }
        
        audio.close()
        video.close()
        
        print(f"✅ Audio extracted: {temp_audio_path}")
        return temp_audio_path, video_info
        
    except ImportError:
        print("❌ moviepy not installed. Install with: pip install moviepy")
        return None, None
    except Exception as e:
        print(f"❌ Error extracting audio: {e}")
        import traceback
        traceback.print_exc()
        return None, None


def transcribe_video(video_path):
    try:
        import assemblyai as aai
        
        if not ASSEMBLYAI_API_KEY:
            return {
                "success": False,
                "error": "ASSEMBLYAI_API_KEY not set. Please set the environment variable."
            }
        
        aai.settings.api_key = ASSEMBLYAI_API_KEY
        
        audio_path, video_info = extract_audio_from_video(video_path)
        
        if not audio_path:
            return {
                "success": False,
                "error": "Could not extract audio from video" if video_info and video_info.get("has_audio", True) else "Video has no audio track"
            }
        
        print("🎙️ Transcribing with AssemblyAI...")
        
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            punctuate=True,
            format_text=True,
            word_boost=["caption", "subtitle"],
            disfluencies=False,
        )
        
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_path, config=config)
        
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
        
        if transcript.status == aai.TranscriptStatus.error:
            return {
                "success": False,
                "error": f"Transcription failed: {transcript.error}"
            }
        
        captions = process_for_realtime_captions(transcript)
        
        vtt_content = generate_webvtt(captions)
        
        speaker_segments = []
        if transcript.utterances:
            for utterance in transcript.utterances:
                speaker_segments.append({
                    "speaker": utterance.speaker,
                    "text": utterance.text,
                    "start": utterance.start / 1000,
                    "end": utterance.end / 1000,
                    "confidence": utterance.confidence
                })
        
        return {
            "success": True,
            "full_transcript": transcript.text,
            "captions": captions,
            "vtt_content": vtt_content,
            "speaker_segments": speaker_segments,  #Diarization data
            "video_info": video_info,
            "word_count": len(transcript.text.split()) if transcript.text else 0,
            "duration": video_info.get("duration", 0) if video_info else 0,
            "speaker_count": len(set(u.speaker for u in transcript.utterances)) if transcript.utterances else 1
        }
        
    except ImportError as e:
        return {
            "success": False,
            "error": f"Missing dependency: {str(e)}. Install with: pip install assemblyai moviepy"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }


def process_for_realtime_captions(transcript):
    captions = []
    
    if transcript.words:
        current_segment = {
            "text": "",
            "words": [],
            "start": None,
            "end": None,
            "speaker": None
        }
        
        word_count = 0
        MAX_WORDS = 7
        MAX_DURATION = 3.0  #seconds
        
        for word in transcript.words:
            word_start = word.start / 1000
            word_end = word.end / 1000
            
            segment_duration = (word_end - current_segment["start"]) if current_segment["start"] else 0
            
            if word_count >= MAX_WORDS or segment_duration > MAX_DURATION:
                if current_segment["text"]:
                    captions.append({
                        "id": len(captions) + 1,
                        "start": round(current_segment["start"], 3),
                        "end": round(current_segment["end"], 3),
                        "text": current_segment["text"].strip(),
                        "speaker": current_segment["speaker"],
                        "words": current_segment["words"]
                    })
                
                current_segment = {
                    "text": "",
                    "words": [],
                    "start": word_start,
                    "end": word_end,
                    "speaker": getattr(word, 'speaker', None)
                }
                word_count = 0
            
            current_segment["text"] += word.text + " "
            current_segment["words"].append({
                "text": word.text,
                "start": round(word_start, 3),
                "end": round(word_end, 3),
                "confidence": word.confidence
            })
            if current_segment["start"] is None:
                current_segment["start"] = word_start
            current_segment["end"] = word_end
            word_count += 1
        
        if current_segment["text"]:
            captions.append({
                "id": len(captions) + 1,
                "start": round(current_segment["start"], 3),
                "end": round(current_segment["end"], 3),
                "text": current_segment["text"].strip(),
                "speaker": current_segment["speaker"],
                "words": current_segment["words"]
            })
    
    return captions


def generate_webvtt(captions):
    vtt_lines = ["WEBVTT", ""]
    
    for caption in captions:
        start_time = format_vtt_time(caption["start"])
        end_time = format_vtt_time(caption["end"])
        
        text = caption["text"]
        if caption.get("speaker"):
            text = f"[Speaker {caption['speaker']}] {text}"
        
        vtt_lines.append(f"{caption['id']}")
        vtt_lines.append(f"{start_time} --> {end_time}")
        vtt_lines.append(text)
        vtt_lines.append("")
    
    return "\n".join(vtt_lines)


def format_vtt_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"


def simplify_transcript(transcript_text):
    try:
        from models.simplification import simplify_text
        result = simplify_text(transcript_text)
        return result.get("simplified_text", transcript_text)
    except Exception as e:
        print(f"⚠️ Could not simplify transcript: {e}")
        return transcript_text


def process_video_for_accessibility(video_path):
    print(f"🎬 Processing video for accessibility: {video_path}")
    
    result = transcribe_video(video_path)
    
    if not result["success"]:
        return result
    
    print("📝 Simplifying transcript...")
    simplified = simplify_transcript(result["full_transcript"])
    result["simplified_transcript"] = simplified
    
    result["accessibility_features"] = {
        "has_captions": True,
        "has_diarization": result.get("speaker_count", 1) > 0,
        "has_word_timing": True,
        "caption_format": "WebVTT",
        "simplified_available": simplified != result["full_transcript"]
    }
    
    print(f"✅ Video processing complete!")
    print(f"   - Duration: {result.get('duration', 0):.1f}s")
    print(f"   - Speakers: {result.get('speaker_count', 1)}")
    print(f"   - Caption segments: {len(result.get('captions', []))}")
    
    return result
