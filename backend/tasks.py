import os, uuid, arxiv
from celery import Celery
from gtts import gTTS
from database import SessionLocal
import models

REDIS_BROKER = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("tasks", broker=REDIS_BROKER, backend=REDIS_BROKER)

@celery_app.task
def execute_agentic_ingestion(topic_query: str):
    db = SessionLocal()
    try:
        search = arxiv.Search(query=topic_query, max_results=2, sort_by=arxiv.SortCriterion.SubmittedDate)
        papers = list(search.results())
        if not papers: return "Empty"

        podcast_id = str(uuid.uuid4())
        primary_paper = papers[0]
        brief_title = f"The Pulse Briefing: {topic_query}"
        exec_summary = f"Overview tracking: '{topic_query}'. Focus document details advancements in {primary_paper.title}."
        section_1 = f"Analysis of methods details: {primary_paper.summary[:250]}..."
        section_2 = f"Document primary Category assigned: {primary_paper.primary_category}."

        audio_directory = "./static_audio"
        os.makedirs(audio_directory, exist_ok=True)
        audio_filename = f"{podcast_id}.mp3"
        
        tts = gTTS(text=f"{brief_title}. {exec_summary}. {section_1}.", lang='en', tld='co.uk')
        tts.save(os.path.join(audio_directory, audio_filename))

        db_podcast = models.DBPodcastBrief(id=podcast_id, title=brief_title, date="Today", summary=exec_summary, summary_section1=section_1, summary_section2=section_2, audio_url=f"http://127.0.0.1:8000/static/{audio_filename}")
        db.add(db_podcast)

        for paper in papers:
            db.add(models.DBContextCard(id=str(uuid.uuid4()), podcast_id=podcast_id, type="paper", title=paper.title, source=f"arXiv: {paper.primary_category}", timestamp="Recent", summary=paper.summary[:150], is_saved=False))
        db.commit()
    except Exception as e: db.rollback(); raise e
    finally: db.close()