from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    is_processed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    image_data: Optional[str] = None

class Citation(BaseModel):
    source: str
    page: Optional[int] = None
    text_snippet: str

class ChatMessageResponse(BaseModel):
    session_id: str
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    confidence_score: float = 1.0
    thought_process: Optional[List[Dict[str, Any]]] = None
    suggested_questions: Optional[List[str]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    id: int
    event_type: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
