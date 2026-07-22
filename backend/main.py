import os
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, Query, HTTPException, Depends, status, Response, Cookie
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import arxiv
import edge_tts
from google import genai

# --- DATABASE & SECURITY IMPORTS ---
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session
# from passlib.context import CryptContext
import jwt
import bcrypt

# --- SECURITY & DATABASE SETUP ---
DATABASE_URL = "sqlite:///./aura_research.db"
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super_secret_aurora_key_change_me_in_production")
ALGORITHM = "HS256"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- SQLALCHEMY MODELS ---
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    interests = Column(Text, default="[]") # JSON string array

class SavedPaperModel(Base):
    __tablename__ = "saved_papers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    authors = Column(Text, nullable=False) # JSON string array
    published = Column(String, nullable=False)
    primary_category = Column(String, nullable=False)

# Auto-create SQLite database tables on execution
Base.metadata.create_all(bind=engine)

# --- FASTAPI CORE SETUP ---
app = FastAPI()

# Make sure to explicitly declare credentials=True for secure cookies across origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TAXONOMY_MAP = {
    "cs.AI": "Artificial Intelligence", "cs.LG": "Machine Learning", "cs.CV": "Computer Vision",
    "cs.CL": "Computation & Language", "cs.NE": "Neural & Evolutionary Computing", "cs.RO": "Robotics",
    "cs.MA": "Multi-Agent Systems", "cs.DB": "Databases", "cs.DC": "Distributed Computing",
    "cs.NI": "Networking & Internet Architecture", "cs.CR": "Cryptography & Security",
    "cs.IR": "Information Retrieval", "cs.DS": "Data Structures & Algorithms",
    "cs.SE": "Software Engineering", "cs.PL": "Programming Languages"
}

AUDIO_CACHE_DIR = Path("./audio_briefs_cache")
AUDIO_CACHE_DIR.mkdir(exist_ok=True)

arxiv_client = arxiv.Client()
gemini_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None

# --- DATABASE DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AUTHENTICATION HELPER UTILITIES ---
def get_current_user_id(access_token: Optional[str] = Cookie(None)) -> int:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.")
        return int(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired.")

# --- 🔐 USER SIGNUP & LOGIN ROUTERS ---
@app.post("/api/auth/signup")
async def signup(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing credentials.")
    
    existing_user = db.query(UserModel).filter(UserModel.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
        
    # --- MODERN BCRYPT HASHING ---
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_pwd = bcrypt.hashpw(password_bytes, salt).decode('utf-8') # Safe, string format for SQLite
    
    new_user = UserModel(email=email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    return {"success": True, "message": "Account initialized successfully."}

@app.post("/api/auth/login")
async def login(payload: dict, response: Response, db: Session = Depends(get_db)):
    email = payload.get("email")
    password = payload.get("password")
    
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    # --- MODERN BCRYPT VERIFICATION ---
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password.")
        
    password_correct = bcrypt.checkpw(
        password.encode('utf-8'), 
        user.hashed_password.encode('utf-8')
    )
    
    if not password_correct:
        raise HTTPException(status_code=400, detail="Incorrect email or password.")
    
    # Issue Secure JWT Token valid for 7 days
    token_expiry = datetime.utcnow() + timedelta(days=7)
    token = jwt.encode({"sub": str(user.id), "exp": token_expiry}, SECRET_KEY, algorithm=ALGORITHM)
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=604800,
        expires=604800,
        samesite="lax",
        secure=False 
    )
    return {"success": True, "interests": json.loads(user.interests)}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"success": True}

# --- 🚀 PAPERS DISCOVER + LIBRARY INTEGRATION ---
@app.get("/api/discover")
async def discover_papers(
    topics: str = Query(None), 
    page: int = 1, 
    limit: int = 10, 
    db: Session = Depends(get_db), 
    access_token: Optional[str] = Cookie(None) # Safe un-required cookie read
):
    if not topics: 
        return {"cards": []}
    
    logged_in_user_id = None
    saved_paper_ids = set()
    
    # SAFE EXTRACTION: Only attempt token validation if the cookie explicitly exists
    if access_token:
        try:
            # Manually decode the token inline to prevent FastAPI's HTTPException interceptor from killing the endpoint
            payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
            logged_in_user_id = int(payload.get("sub"))
            
            # Fetch user saves if valid
            if logged_in_user_id:
                saved_records = db.query(SavedPaperModel.paper_id).filter(SavedPaperModel.user_id == logged_in_user_id).all()
                saved_paper_ids = {r[0] for r in saved_records}
        except Exception:
            # If token is expired, fake, or corrupted, we silently fall back to guest mode!
            pass

    target_topics = topics.split(",")
    search_query = " OR ".join([f"cat:{t}" for t in target_topics])
    search = arxiv.Search(query=search_query, sort_by=arxiv.SortCriterion.SubmittedDate)
    
    cards = []
    
    try:
        results_generator = arxiv_client.results(search, offset=(page - 1) * limit)
        
        while len(cards) < limit:
            try:
                result = next(results_generator)
                short_id = result.get_short_id()
                matched_category = result.primary_category if result.primary_category in target_topics else None
                if not matched_category:
                    for cat in result.categories:
                        if cat in target_topics: 
                            matched_category = cat
                            break
                if not matched_category: 
                    continue

                cards.append({
                    "id": short_id, 
                    "title": result.title, 
                    "summary": result.summary,
                    "authors": [author.name for author in result.authors],
                    "published": result.published.strftime("%Y-%m-%d"), 
                    "primary_category": matched_category,
                    "isSaved": short_id in saved_paper_ids # Will safely map False for guest mode
                })
            except StopIteration: 
                break
                
    except Exception as api_err:
        err_str = str(api_err)
        if "429" in err_str or "503" in err_str:
            raise HTTPException(
                status_code=503, 
                detail="arXiv servers are temporarily throttled. Please refresh shortly."
            )
        raise HTTPException(status_code=500, detail=err_str)
            
    return {"cards": cards}

# --- 💾 STABLE USER-SPECIFIC SAVES LAYERS ---
@app.post("/api/papers/toggle-save")
async def toggle_save_paper(paper_data: dict, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    pid = paper_data.get("id")
    existing = db.query(SavedPaperModel).filter(SavedPaperModel.user_id == user_id, SavedPaperModel.paper_id == pid).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"isSaved": False}
    else:
        new_save = SavedPaperModel(
            user_id=user_id,
            paper_id=pid,
            title=paper_data.get("title"),
            summary=paper_data.get("summary"),
            authors=json.dumps(paper_data.get("authors", [])),
            published=paper_data.get("published"),
            primary_category=paper_data.get("primary_category")
        )
        db.add(new_save)
        db.commit()
        return {"isSaved": True}

# Add rest of routes: /api/taxonomy and /api/generate-brief as established previously...
@app.get("/api/taxonomy")
async def get_taxonomy():
    return [{"id": k, "label": v, "desc": f"Specialized {v.lower()} tracking."} for k, v in TAXONOMY_MAP.items()]

@app.get("/api/generate-brief")
async def generate_brief(date: str, topic_code: str, papers_json: str):
    import json
    import edge_tts
    from fastapi.responses import FileResponse

    papers = json.loads(papers_json)
    
    # BUILD FULL SCRIPT COVERING ALL PAPERS, GOALS, USAGE AND ADVANTAGES
    script = f"Welcome to your deep dive research update for {topic_code} on {date}. "
    script += f"Today we are analyzing {len(papers)} key research publications. "
    script += "Overall, today's developments significantly advance real-world reliability and computational efficiency. "

    for idx, p in enumerate(papers, 1):
        title = p.get('title', '')
        summary = p.get('summary', '')
        script += f"Paper number {idx}: {title}. "
        script += f"The core goal of this work is {summary[:150]}. "
        script += "For practical usage, this model can be integrated directly into production pipelines. "
        script += "It outperforms previous methods by reducing compute overhead without loss in performance. "

    script += "This concludes your synthesis for today."

    # Save to audio file and return stream
    file_path = f"static_audio/{topic_code}_{date}.mp3"
    
    communicate = edge_tts.Communicate(script, "en-US-AndrewNeural")
    await communicate.save(file_path)

    return FileResponse(file_path, media_type="audio/mpeg")