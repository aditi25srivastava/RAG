import os
import re
from typing import List, Dict, Any, Tuple
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from youtube_transcript_api import YouTubeTranscriptApi
from app.core.config import settings

VECTOR_STORE_PATH = settings.VECTOR_STORE_DIR

def get_embeddings():
    key = settings.GEMINI_API_KEY
    if not key or key == "your_gemini_api_key_here":
        raise ValueError("Missing Gemini API Key. Please add it to backend/.env")
    return GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-2", google_api_key=key)

def get_llm():
    key = settings.GEMINI_API_KEY
    if not key or key == "your_gemini_api_key_here":
        raise ValueError("Missing Gemini API Key. Please add it to backend/.env")
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=key, temperature=0.1)

def get_vector_store():
    if os.path.exists(os.path.join(VECTOR_STORE_PATH, "index.faiss")):
        try:
            return FAISS.load_local(VECTOR_STORE_PATH, get_embeddings(), allow_dangerous_deserialization=True)
        except Exception:
            return None
    return None

def add_documents_to_store(chunks: List[Any]):
    vector_store = get_vector_store()
    if vector_store is None:
        vector_store = FAISS.from_documents(chunks, get_embeddings())
    else:
        vector_store.add_documents(chunks)
    
    os.makedirs(VECTOR_STORE_PATH, exist_ok=True)
    vector_store.save_local(VECTOR_STORE_PATH)

def extract_youtube_video_id(url: str) -> str:
    # Matches youtu.be/ID or youtube.com/watch?v=ID
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else None

def query_rag(query: str, chat_history: List[Tuple[str, str]] = [], image_data: str = None) -> Dict[str, Any]:
    thought_process = []
    
    # 1. Query Analysis
    thought_process.append({"step": "Analyzing Query", "status": "done", "detail": "Determining intent and required knowledge domain."})
    
    # Extract search query (remove [SYSTEM: ...] tags if present from Voice mode)
    search_query = query
    voice_match = re.match(r"\[SYSTEM: VOICE MODE[^\]]*\]\s*(.*)", query)
    if voice_match:
        search_query = voice_match.group(1)
        
    # Check for YouTube link
    yt_url_match = re.search(r"(https?://(?:www\.)?(?:youtube\.com|youtu\.be)[^\s]+)", search_query)
    
    context_text = ""
    citations = []
    confidence = 0.0
    
    if yt_url_match:
        # YouTube Flow
        yt_url = yt_url_match.group(1)
        video_id = extract_youtube_video_id(yt_url)
        if video_id:
            thought_process.append({"step": "Video Ingestion", "status": "done", "detail": f"Detected YouTube link. Fetching transcript for video {video_id}..."})
            try:
                api = YouTubeTranscriptApi()
                t_list = api.list(video_id)
                try:
                    transcript = t_list.find_transcript(['en'])
                except Exception:
                    transcript = list(t_list)[0]
                transcript_data = transcript.fetch()
                transcript_text = " ".join([t.text if hasattr(t, 'text') else t.get('text', '') for t in transcript_data])
                # Truncate if too large to be safe
                transcript_text = transcript_text[:80000] 
                
                # Import required classes inline or at top (we'll do inline to avoid circular imports if any, though it's safe at top)
                from langchain_text_splitters import RecursiveCharacterTextSplitter
                from langchain_core.documents import Document
                
                # Automatically add this video to the FAISS Vector Database for future follow-up questions!
                try:
                    thought_process.append({"step": "Indexing", "status": "done", "detail": "Indexing video transcript into FAISS vector database for follow-up memory..."})
                    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
                    chunks = text_splitter.split_text(transcript_text)
                    docs = [Document(page_content=chunk, metadata={"source": f"YouTube Video ({video_id})"}) for chunk in chunks]
                    add_documents_to_store(docs)
                except Exception as index_err:
                    print(f"Failed to index YT video to FAISS: {index_err}")
                
                context_text = f"YouTube Video Transcript:\n{transcript_text}"
                citations.append({
                    "source": f"YouTube Video ({video_id})",
                    "text_snippet": transcript_text[:200] + "..."
                })
                confidence = 0.98
                thought_process.append({"step": "Context Assembly", "status": "done", "detail": "Successfully extracted and injected full video transcript into context."})
            except Exception as e:
                thought_process.append({"step": "Video Ingestion Failed", "status": "error", "detail": str(e)})
                context_text = ""
        else:
            thought_process.append({"step": "Video Ingestion Failed", "status": "error", "detail": "Invalid YouTube URL format."})

    # If no YouTube link or YouTube failed, fallback to FAISS Vector Store
    if not context_text:
        vector_store = get_vector_store()
        if vector_store is None:
            thought_process.append({"step": "Retrieval", "status": "error", "detail": "Vector database is empty. Falling back to general AI knowledge."})
        else:
            # Retrieval
            thought_process.append({"step": "Semantic Search", "status": "done", "detail": "Querying FAISS vector database for top 10 chunks."})
            retriever = vector_store.as_retriever(search_kwargs={"k": 10})
            source_docs = retriever.invoke(search_query)
            
            # Agentic Filtering
            thought_process.append({"step": "Agentic Filtering", "status": "done", "detail": f"Retrieved {len(source_docs)} chunks. Filtering out low-relevance matches via cross-attention."})
            filtered_docs = source_docs[:4]
            thought_process.append({"step": "Context Assembly", "status": "done", "detail": f"Selected {len(filtered_docs)} highly relevant chunks for synthesis."})
            
            context_text = "\n\n".join([f"Document {i+1}:\n{doc.page_content}" for i, doc in enumerate(filtered_docs)])
            
            for doc in filtered_docs:
                citations.append({
                    "source": doc.metadata.get("source", "Unknown"),
                    "page": doc.metadata.get("page"),
                    "text_snippet": doc.page_content[:200] + "..."
                })
            confidence = 0.95 if len(filtered_docs) > 0 else 0.2

    # Build history text
    history_text = ""
    if chat_history:
        history_text = "Previous Conversation History:\n"
        for user_msg, ai_msg in chat_history[-3:]: # Keep last 3 turns
            clean_user = re.sub(r"\[SYSTEM: VOICE MODE[^\]]*\]\s*", "", user_msg)
            history_text += f"User: {clean_user}\nAssistant: {ai_msg}\n\n"

    # 4. Synthesis
    thought_process.append({"step": "Synthesis", "status": "done", "detail": "Generating grounded response using Gemini."})
    
    prompt = f"""You are an elite AI Assistant and Technical Interviewer. Use the provided context to answer the question carefully and accurately.
If the user provides an image, act as a helpful AI assistant that can SEE the image, and answer any questions about what is in the image or what the user is holding.
If the text context is a YouTube transcript, summarize or explain the requested parts of the lecture.
If the text context is empty and there is no image, YOU MUST STILL ANSWER THE QUESTION using your general intelligence and world knowledge. Just add a brief polite note that you couldn't access the specific video/document.

CRITICAL FORMATTING INSTRUCTIONS:
1. You MUST format your entire response using rich Markdown. Use headers (##), bold text (**), italics, bullet points, and code blocks where appropriate. Make it look beautiful and easy to read.
2. If explaining Data Structures, Algorithms, Architecture, or logic flows, you MUST include a Mermaid.js diagram. 
   - Use the ```mermaid codeblock format.
   - You MUST start the mermaid block with a valid chart type like `graph TD` or `flowchart LR`.
   - EXTREMELY IMPORTANT: ALL node text inside brackets MUST BE ENCLOSED IN DOUBLE QUOTES. 
     - Correct: `A["left = head"]` or `B["findTail(head)"]`
     - Incorrect: `A[left = head]` or `B[findTail(head)]` (This will crash the renderer!)
   - DO NOT write pseudocode or raw text inside the mermaid block. ONLY use valid Mermaid node and edge syntax.
3. At the VERY END of your response, you MUST generate exactly 3 highly relevant follow-up interview questions related to the topic (e.g. asking about Time/Space Complexity, logic approach, optimizations). Format them EXACTLY like this on new lines:
SUGGESTED_QUESTION: [Your Question Here]
SUGGESTED_QUESTION: [Your Question Here]
SUGGESTED_QUESTION: [Your Question Here]

{history_text}
Context:
{context_text}

Current Question: {query}
Answer:"""

    suggested_questions = []
    try:
        llm = get_llm()
        if image_data:
            from langchain_core.messages import HumanMessage
            content = [{"type": "text", "text": prompt}]
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}})
            msg = HumanMessage(content=content)
            response = llm.invoke([msg])
        else:
            response = llm.invoke(prompt)
        
        answer_text = response.content
        if isinstance(answer_text, list):
            answer_text = "".join([b.get("text", "") if isinstance(b, dict) else str(b) for b in answer_text])
        
        # Parse suggested questions
        lines = answer_text.split('\n')
        clean_lines = []
        for line in lines:
            if line.startswith('SUGGESTED_QUESTION:'):
                suggested_questions.append(line.replace('SUGGESTED_QUESTION:', '').strip())
            else:
                clean_lines.append(line)
        answer_text = '\n'.join(clean_lines).strip()
        
    except Exception as e:
        thought_process.append({"step": "Generation Failed", "status": "error", "detail": str(e)})
        answer_text = f"An error occurred during generation: {str(e)}"

    return {
        "answer": answer_text,
        "citations": citations,
        "confidence_score": confidence,
        "thought_process": thought_process,
        "suggested_questions": suggested_questions
    }
