from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import shutil
from typing import List

from app.core.database import get_db
from app.core.config import settings
from app.models import domain, schemas
from app.services.document_processor import process_document
from app.services.rag_service import add_documents_to_store

router = APIRouter()

@router.post("/upload", response_model=schemas.DocumentResponse)
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save to DB initially as unprocessed
    db_doc = domain.Document(
        filename=file.filename,
        content_type=file.content_type,
        file_path=file_path,
        is_processed=False
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    try:
        # Process and Chunk
        chunks = process_document(file_path, file.filename)
        # Add to Vector Store
        add_documents_to_store(chunks)
        
        # Mark as processed
        db_doc.is_processed = True
        db.commit()
        db.refresh(db_doc)
        
        # Log Analytics
        analytics_event = domain.Analytics(event_type="document_upload", details={"filename": file.filename})
        db.add(analytics_event)
        db.commit()
        
    except Exception as e:
        db.delete(db_doc)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
        
    return db_doc

@router.get("/", response_model=List[schemas.DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    docs = db.query(domain.Document).all()
    return docs
