from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Tuple
import uuid

from app.core.database import get_db
from app.models import domain, schemas
from app.services.rag_service import query_rag

router = APIRouter()

@router.post("/", response_model=schemas.ChatMessageResponse)
def chat(request: schemas.ChatMessageRequest, db: Session = Depends(get_db)):
    session_id = request.session_id
    if not session_id:
        session_id = str(uuid.uuid4())
        # Create new session
        db_session = domain.ChatSession(session_id=session_id)
        db.add(db_session)
        db.commit()

    # Save user message
    user_msg = domain.ChatMessage(session_id=session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    # Fetch history for memory
    history = db.query(domain.ChatMessage).filter(domain.ChatMessage.session_id == session_id).order_by(domain.ChatMessage.created_at).all()
    chat_history: List[Tuple[str, str]] = []
    
    current_user_msg = None
    for msg in history:
        if msg.role == "user":
            current_user_msg = msg.content
        elif msg.role == "assistant" and current_user_msg:
            chat_history.append((current_user_msg, msg.content))
            current_user_msg = None

    try:
        result = query_rag(request.message, chat_history, image_data=request.image_data)
        
        # Save assistant response
        assistant_msg = domain.ChatMessage(
            session_id=session_id, 
            role="assistant", 
            content=result["answer"],
            citations=result["citations"],
            thought_process=result.get("thought_process", [])
        )
        db.add(assistant_msg)
        
        # Log analytics
        if result.get("confidence_score", 1.0) < 0.5:
            db.add(domain.Analytics(event_type="low_confidence_answer", details={"session": session_id, "query": request.message}))
            
        db.add(domain.Analytics(event_type="query", details={"session": session_id}))
        db.commit()
        db.refresh(assistant_msg)
        
        return schemas.ChatMessageResponse(
            session_id=session_id,
            role="assistant",
            content=result["answer"],
            citations=result["citations"],
            confidence_score=result.get("confidence_score", 1.0),
            thought_process=result.get("thought_process", []),
            suggested_questions=result.get("suggested_questions", []),
            created_at=assistant_msg.created_at
        )

    except ValueError as e:
        # e.g., missing API key
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.get("/{session_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(domain.ChatMessage).filter(domain.ChatMessage.session_id == session_id).order_by(domain.ChatMessage.created_at).all()
    
    response = []
    for msg in messages:
        response.append(schemas.ChatMessageResponse(
            session_id=session_id,
            role=msg.role,
            content=msg.content,
            citations=msg.citations,
            thought_process=msg.thought_process,
            created_at=msg.created_at
        ))
    return response
