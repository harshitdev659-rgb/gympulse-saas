import io
import speech_recognition as sr
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_gym, require_staff_or_above
from app.models.models import Gym, User
from app.schemas.schemas import AIQueryRequest, AIQueryResponse
from app.services.ai_service import AIAssistantService

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

@router.post("/query", response_model=AIQueryResponse)
def query_ai_assistant(
    req: AIQueryRequest,
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym),
    db: Session = Depends(get_db)
):
    """
    Intelligent AI assistant answering operational gym questions.
    STRICT MULTI-TENANT ISOLATION: The AI engine queries only data
    belonging to current_gym.id and never exposes other gym records.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty."
        )

    result = AIAssistantService.query(req.query.strip(), current_gym, db)
    return AIQueryResponse(
        query=result["query"],
        answer=result["answer"],
        suggested_actions=result.get("suggested_actions", []),
        data=result.get("data")
    )

@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    current_user: User = Depends(require_staff_or_above),
    current_gym: Gym = Depends(get_current_gym)
):
    """
    Transcribes microphone audio WAV recording to text.
    Handles all conditions gracefully with zero 500 errors.
    """
    try:
        content = await audio.read()
        if not content or len(content) < 44:
            return {"success": False, "text": "", "message": "Audio recording was empty."}

        recognizer = sr.Recognizer()
        with sr.AudioFile(io.BytesIO(content)) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return {"success": True, "text": text}
    except sr.UnknownValueError:
        return {"success": False, "text": "", "message": "Could not detect clear speech. Please speak closer to your microphone."}
    except sr.RequestError:
        return {"success": False, "text": "", "message": "Speech network service is temporarily unreachable. Please type your query."}
    except Exception as e:
        return {"success": False, "text": "", "message": f"Could not process audio: {str(e)}"}
