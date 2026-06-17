from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import domain, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.AnalyticsResponse])
def get_analytics(db: Session = Depends(get_db)):
    events = db.query(domain.Analytics).order_by(domain.Analytics.created_at.desc()).limit(100).all()
    return events
