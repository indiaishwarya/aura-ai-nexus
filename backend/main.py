import os
import json
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import arxiv
import edge_tts
from google import genai  # <-- Free tier Gemini SDK

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Initialize the Gemini Client if key exists
gemini_key = os.getenv("GEMINI_API_KEY")
gemini_client = genai.Client(api_key=gemini_key) if gemini_key else None

@app.get("/api/taxonomy")
async def get_taxonomy():
    return [{"id": k, "label": v, "desc": f"Specialized {v.lower()} tracking."} for k, v in TAXONOMY_MAP.items()]

@app.get("/api/discover")
async def discover_papers(topics: str = Query(None), page: int = 1, limit: int = 10):
    if not topics: return {"cards": []}
    target_topics = topics.split(",")
    search_query = " OR ".join([f"cat:{t}" for t in target_topics])
    search = arxiv.Search(query=search_query, sort_by=arxiv.SortCriterion.SubmittedDate)
    results_generator = arxiv_client.results(search, offset=(page - 1) * limit)
    
    cards = []
    while len(cards) < limit:
        try:
            result = next(results_generator)
            matched_category = result.primary_category if result.primary_category in target_topics else None
            if not matched_category:
                for cat in result.categories:
                    if cat in target_topics: matched_category = cat; break
            if not matched_category: continue

            cards.append({
                "id": result.get_short_id(), "title": result.title, "summary": result.summary,
                "authors": [author.name for author in result.authors],
                "published": result.published.strftime("%Y-%m-%d"), "primary_category": matched_category,
                "isSaved": False
            })
        except StopIteration: break
    return {"cards": cards}

@app.get("/api/generate-brief")
async def generate_brief(date: str, topic_code: str, papers_json: str = Query(...)):
    friendly_name = TAXONOMY_MAP.get(topic_code, topic_code).replace(" ", "_")
    safe_filename = f"{date}_{friendly_name}_deepdive.mp3"
    file_path = AUDIO_CACHE_DIR / safe_filename
    
    if file_path.exists():
        return FileResponse(path=file_path, media_type="audio/mpeg", filename=safe_filename)
    
    try:
        papers = json.loads(papers_json)
        if not papers: raise HTTPException(status_code=400, detail="No papers.")
        
        topic_title = TAXONOMY_MAP.get(topic_code, topic_code)
        
        # 1. AI Intelligence Generation (Using Free Gemini)
        if gemini_client:
            papers_context = "\n\n".join([f"Title: {p['title']}\nAbstract: {p['summary']}" for p in papers])
            
            prompt = f"""
            You are a senior tech research analyst presenting a deep-dive audio podcast summary for {topic_title} publications on {date}.
            Review these academic papers and synthesize them into a unified, flowing conversational narration.
            
            Structure requirements:
            1. Introduce the overarching themes and structural breakthroughs found across today's discoveries.
            2. Point out specific, notable methodology advancements from the papers.
            3. Explicitly break down how these developments apply directly to the tech industry, including a practical hypothetical use-case example.
            
            Keep the tone casual, professional, engaging, and articulate. Avoid bullet points or markdown syntax. Speak naturally.
            
            Papers data:
            {papers_context}
            """
            
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            script_text = response.text
        else:
            # Fallback narrative script if no Gemini key is provided
            script_text = f"Welcome to your deep dive review for {topic_title} on {date}. Today we are assessing a collection of {len(papers)} publications. Looking across the abstracts, the core focus centers around architectural efficiency. For industry teams, these mathematical refinements unlock immediate value by minimizing inference compute profiles. A prime use case is deploying complex pipelines to edge devices or real-time mobile environments where latency directly impacts client adoption loops."

        # 2. Premium Free Edge-TTS Audio Generation
        communicate = edge_tts.Communicate(script_text, "en-US-BrianNeural")
        await communicate.save(str(file_path))
        
        return FileResponse(path=file_path, media_type="audio/mpeg", filename=safe_filename)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))