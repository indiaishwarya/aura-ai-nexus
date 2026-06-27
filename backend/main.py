from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import models
import arxiv
from database import engine, get_db
from tasks import execute_agentic_ingestion

models.Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/static", StaticFiles(directory="static_audio"), name="static")

# Enable CORS so your frontend can call this
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARXIV_CS_TAXONOMY = [
    # Core AI & Learning Matrix
    {"id": "cs.AI", "label": "Artificial Intelligence", "desc": "Neural frameworks, cognitive systems & predictive clusters"},
    {"id": "cs.LG", "label": "Machine Learning", "desc": "Deep learning architectures & automatic parameter tuning"},
    {"id": "cs.CV", "label": "Computer Vision", "desc": "Image synthesis, pattern recognition & visual vector models"},
    {"id": "cs.CL", "label": "Computation & Language", "desc": "LLMs, natural language processing & semantic parsing"},
    {"id": "cs.NE", "label": "Neural & Evolutionary Computing", "desc": "Biologically inspired networks & complex system dynamics"},
    
    # Systems & Data Architecture
    {"id": "cs.RO", "label": "Robotics", "desc": "Control logic, planning & autonomous mechanical nodes"},
    {"id": "cs.MA", "label": "Multi-Agent Systems", "desc": "Distributed agent network coordination & game theory"},
    {"id": "cs.DB", "label": "Databases", "desc": "Data indexing structures, storage engine architectures & scale"},
    {"id": "cs.DC", "label": "Distributed Computing", "desc": "Parallel processing, cluster fabrics & fault-tolerance"},
    {"id": "cs.NI", "label": "Networking & Internet Architecture", "desc": "Routing topologies, security fabrics & transport protocols"},
    
    # Security & Theoretical Foundations
    {"id": "cs.CR", "label": "Cryptography & Security", "desc": "Network security, privacy protocols & cryptographic bounds"},
    {"id": "cs.IR", "label": "Information Retrieval", "desc": "Search engine design, indexing vectors & ranking metrics"},
    {"id": "cs.DS", "label": "Data Structures & Algorithms", "desc": "Complexity bounds, optimization curves & data sorting"},
    {"id": "cs.SE", "label": "Software Engineering", "desc": "System architecture design, validation frameworks & code metrics"},
    {"id": "cs.PL", "label": "Programming Languages", "desc": "Compiler design, type theory & structural semantics"}
]

@app.get("/api/taxonomy")
async def get_taxonomy():
    return ARXIV_CS_TAXONOMY

arxiv_client = arxiv.Client()

@app.get("/api/discover")
async def discover_papers(topics: str = Query(None), page: int = 1, limit: int = 10):
    if not topics:
        return {"podcasts": [], "cards": []}
    
    # User's target topics, e.g., ['cs.RO', 'cs.LG', 'cs.CV']
    target_topics = topics.split(",")
    search_query = " OR ".join([f"cat:{t}" for t in target_topics])
    
    search = arxiv.Search(
        query=search_query,
        sort_by=arxiv.SortCriterion.SubmittedDate
    )
    
    start_offset = (page - 1) * limit
    results_generator = arxiv_client.results(search, offset=start_offset)
    
    cards = []
    
    # Keep pulling until we fill the page limit or run out of results
    while len(cards) < limit:
        try:
            result = next(results_generator)
            
            # --- THE CRITICAL INTERCEPTOR FILTER ---
            # Identify which requested topic this paper actually satisfies
            # Check the primary category first, then fallback to other cross-listings
            matched_category = None
            if result.primary_category in target_topics:
                matched_category = result.primary_category
            else:
                # Look through all categories assigned to the paper
                for cat in result.categories:
                    if cat in target_topics:
                        matched_category = cat
                        break
            
            # If the paper doesn't strictly match any requested topic, skip it!
            if not matched_category:
                continue
            # --------------------------------------

            cards.append({
                "id": result.get_short_id(),
                "title": result.title,
                "summary": result.summary,
                "authors": [author.name for author in result.authors],
                "published": result.published.strftime("%Y-%m-%d"),
                "primary_category": matched_category,  # Enforce the selected category for frontend grouping
                "isSaved": False
            })
            
        except StopIteration:
            break  # No more matching arXiv papers left
        
    return {
        "podcasts": [],
        "cards": cards
    }

@app.post("/api/fetch-topic")
def trigger_topic_ingestion(topic: str):
    if not topic.strip(): raise HTTPException(status_code=400, detail="Empty query")
    task = execute_agentic_ingestion.delay(topic.strip())
    return {"status": "processing", "task_id": task.id}