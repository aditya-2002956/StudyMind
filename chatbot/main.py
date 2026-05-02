from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# This is the AI tutor's personality — edit this text!
TUTOR_PROMPT = """You are StudyMind, a friendly AI tutor for students.
Your job is to explain topics clearly and simply.
Always give hints before full answers — make students think first.
Keep answers short (3-5 sentences max).
If asked something not related to studying, say:
'I am only here to help you study!'"""

model = genai.GenerativeModel("gemini-1.5-flash")

class ChatRequest(BaseModel):
    message: str
    subject: str = "general"
    history: list = []

@app.post("/chat")
async def chat(req: ChatRequest):
    # Build conversation history for context
    history = [{"role": "user", "parts": [TUTOR_PROMPT]}]
    for h in req.history[-6:]:   # only last 6 messages (saves cost)
        history.append({"role": h["role"], "parts": [h["content"]]})

    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(
        f"Subject: {req.subject}\nStudent question: {req.message}"
    )
    return {"reply": response.text}

@app.get("/ping")
def ping():
    return {"status": "chatbot is alive"}
