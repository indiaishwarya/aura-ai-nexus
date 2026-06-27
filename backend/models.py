from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class DBPodcastBrief(Base):
    __tablename__ = "podcasts"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    date = Column(String)
    summary = Column(Text)
    summary_section1 = Column(Text)
    summary_section2 = Column(Text)
    audio_url = Column(String)
    cards = relationship("DBContextCard", back_populates="parent_podcast")

class DBContextCard(Base):
    __tablename__ = "context_cards"
    id = Column(String, primary_key=True, index=True)
    podcast_id = Column(String, ForeignKey("podcasts.id"))
    type = Column(String)
    title = Column(String)
    source = Column(String)
    timestamp = Column(String)
    summary = Column(Text)
    is_saved = Column(Boolean, default=False)
    parent_podcast = relationship("DBPodcastBrief", back_populates="cards")