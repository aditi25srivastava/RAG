# 🚀 AI Interview Session & Research Assistant (2026 Edition)

A bleeding-edge, full-stack AI application combining **Real-Time Multimodal Vision**, **FAISS Vector RAG**, and **Continuous Voice Streaming** to create a next-generation "AI Interviewer and Researcher". 

This project goes far beyond a standard text-based chatbot, featuring a continuous hands-free voice interface, live YouTube transcription indexing, and the ability to "see" your physical environment through live webcam capture via Google's `gemini-2.5-flash` model.

## ✨ Core Features

### 1. 👁️ Real-Time Multimodal Vision
- The AI can actively "see" what you are holding up to the camera or showing on your screen.
- Frames are captured, converted to Base64 payloads, and sent to the multimodal Gemini engine in real-time, allowing the AI to answer physical, visual questions instantly.
- Features a beautiful floating "Picture-in-Picture" UI with glassmorphism effects.

### 2. 🧠 Unified RAG Brain (FAISS & YouTube)
- Drop a YouTube video link into the Research Chat. The backend automatically downloads the transcript, chunks it, and injects it into a persistent **FAISS Vector Database** using Google's `gemini-embedding-2` model.
- You can jump into a voice session later and ask highly specific questions about the video. The AI will cross-reference the vector database and generate a grounded, synthesized answer instantly.

### 3. 🎙️ Continuous Conversational Voice Loop
- **Hands-Free Operation:** A single master toggle starts the conversation. The AI listens, processes, speaks, and immediately begins listening again.
- **Human-like Interruption:** Tap the **Spacebar** while the AI is speaking to instantly halt the synthetic voice and interject with a new thought—exactly like a real conversation.
- **Karaoke UI Captions:** An elegant sliding window of text displays the AI's exact spoken words synchronously with the audio, preventing the "wall of text" fatigue seen in older chatbots.

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), Lucide-React, CSS3 (Glassmorphism & Gradients)
*   **Voice Engine**: Native Browser `SpeechRecognition` & `SpeechSynthesis`
*   **Backend**: Python, FastAPI, SQLAlchemy
*   **AI / LLM Core**: LangChain, `gemini-2.5-flash`, `gemini-embedding-2`
*   **Database**: SQLite (Session state), FAISS Vector Store (Embeddings)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js & npm
- Python 3.12+
- Gemini API Key

### Backend Setup
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -r requirements.txt`
5. Create a `.env` file and add your API key:
   ```
   GEMINI_API_KEY=your_key_here
   ```
6. Run the server: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. The application will be running at `http://localhost:5174` (or 5173).

---

## 📸 Screenshots

*(Add your screenshots here! Take a picture of the camera UI and the research chat).*

---
*Built for the 2026 standard of AI interactability.*
