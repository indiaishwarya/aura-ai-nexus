# Aura Research AI Dashboard

An intelligent research tracking platform that automatically pulls daily academic publications from arXiv, structures them chronologically by specific scientific domains, generates dynamic contextual summaries, and synthesizes deep-dive audio briefings using premium free AI layers.

---

## Key Features

* **Dynamic Scroll-Spy Navigation:** Multi-tier sticky sub-headers (Dates anchor at `top-0`, friendly Topic Names stack at `top-14`) for rapid contextual scanning.
* **Intelligent Audio Deep Dives:** Translates dry abstract text data into a cohesive, conversational audio podcast format that details real-world industry use cases.
* **Premium Free Audio Pipeline:** Bypasses paid subscription barriers entirely by uniting **Google Gemini (Free Tier)** for analytical scripting and **Edge-TTS** for hyper-realistic neural voice synthesis.
* **Local Caching Engine:** Caches generated `.mp3` briefings dynamically, preventing duplicate API round-trips and ensuring near-instantaneous streaming playback.
* **On-Scroll Infinite Retrieval:** Automated pagination listeners continuously fetch older chronological paper batches from arXiv as you scroll down the workspace.

---

## Technology Stack

* **Frontend:** Next.js (TypeScript), Tailwind CSS, Lucide React, HTML5 Audio API.
* **Backend:** FastAPI (Python), Uvicorn, Asynchronous WebSockets.
* **Data Aggregation:** Native arXiv Scraper Client API.
* **Synthesis & Text-to-Speech:** Google GenAI SDK (`gemini-2.5-flash`) & `edge-tts`.

---

## Local Installation & Setup

### 1. Backend Service (FastAPI)

Navigate into your backend folder, initialize your virtual environment, and install the required dependencies:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install core packages
pip install fastapi uvicorn arxiv edge-tts google-genai
```

Grab your free API developer key from Google AI Studio, export it to your shell, and kick off the local development server:

```bash
export GEMINI_API_KEY="your_actual_free_gemini_api_key_here"
uvicorn main:app --reload --port 8000
```

### 2. Frontend Interface (Next.js)
Navigate into your frontend workspace folder, install node dependencies, and boot up your local developer instance:
```bash
cd frontend
npm install
npm run dev
```
Open up your browser and visit http://localhost:3000 to interact with the platform.