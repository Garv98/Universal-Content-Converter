import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

def transcribe_with_assemblyai(audio_path, num_speakers=None):
    try:
        import assemblyai as aai
        
        api_key = os.getenv("ASSEMBLYAI_API_KEY")
        if not api_key:
            print("⚠️ No ASSEMBLYAI_API_KEY found")
            return None
        
        aai.settings.api_key = api_key
        
        print("🎤 Uploading audio to AssemblyAI...")
        
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speakers_expected=num_speakers if num_speakers else None
        )
        
        print("🔍 Transcribing with speaker diarization...")
        
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(audio_path, config=config)
        
        if transcript.status == aai.TranscriptStatus.error:
            print(f"❌ Transcription failed: {transcript.error}")
            return None
        
        segments = []
        for utterance in transcript.utterances:
            segments.append({
                'text': utterance.text,
                'speaker': utterance.speaker,
                'start': utterance.start / 1000.0,
                'end': utterance.end / 1000.0
            })
        
        unique_speakers = sorted(set(seg['speaker'] for seg in segments))
        speaker_map = {spk: idx for idx, spk in enumerate(unique_speakers)}
        
        for seg in segments:
            seg['speaker'] = speaker_map[seg['speaker']]
        
        num_speakers_detected = len(unique_speakers)
        print(f"✅ AssemblyAI detected {num_speakers_detected} speakers with {len(segments)} utterances")
        
        return {
            'segments': segments,
            'speaker_count': num_speakers_detected,
            'text': transcript.text
        }
        
    except ImportError:
        print("⚠️ AssemblyAI not installed - run: pip install assemblyai")
        return None
    except Exception as e:
        import traceback
        print(f"⚠️ AssemblyAI transcription failed: {e}")
        traceback.print_exc()
        return None


def group_segments_by_speaker(segments):
    if not segments:
        return []
    
    turns = []
    current_turn = None
    
    for segment in segments:
        speaker = segment.get('speaker', 0)
        
        if current_turn is None or current_turn['speaker'] != speaker:
            if current_turn:
                turns.append(current_turn)
            
            current_turn = {
                'speaker': speaker,
                'start': segment['start'],
                'end': segment['end'],
                'text': segment['text'],
                'segments': [segment]
            }
        else:
            current_turn['end'] = segment['end']
            current_turn['text'] += ' ' + segment['text']
            current_turn['segments'].append(segment)
    
    if current_turn:
        turns.append(current_turn)
    
    for turn in turns:
        turn['duration'] = round(turn['end'] - turn['start'], 2)
        turn['segment_count'] = len(turn['segments'])
        turn['word_count'] = len(turn['text'].split())
    
    return turns


def transcribe_audio(audio_file, language="en"):
    """transcribe using speaker diarization"""
    temp_path = None
    
    try:
        if hasattr(audio_file, 'save'):
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
            temp_file.close()
        elif hasattr(audio_file, 'read'):
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
            temp_file.write(audio_file.read())
            temp_file.close()
            temp_path = temp_file.name
        else:
            temp_path = audio_file
        
        print(f"🎤 Processing Audio: {os.path.basename(temp_path)}")
        
        result = transcribe_with_assemblyai(temp_path)
        
        if not result:
            return {
                "success": False,
                "error": "AssemblyAI transcription failed",
                "segments": [],
                "text": "",
                "language": language
            }
        
        segments = result['segments']
        speaker_count = result['speaker_count']
        full_text = result['text']
        
        speaker_turns = group_segments_by_speaker(segments)
        
        print(f"✅ Complete: {speaker_count} speakers, {len(segments)} segments, {len(full_text)} chars")
        
        return {
            "success": True,
            "text": full_text,
            "segments": segments,
            "speaker_turns": speaker_turns,
            "speaker_count": speaker_count,
            "language": language,
            "model": "assemblyai",
            "chars": len(full_text),
            "words": len(full_text.split())
        }
        
    except ImportError:
        return {
            "success": False,
            "error": "Required packages not installed. Run: pip install assemblyai",
            "segments": [],
            "text": "",
            "language": language
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "segments": [],
            "text": "",
            "language": language
        }
    finally:
        if temp_path and hasattr(audio_file, 'save') and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass
