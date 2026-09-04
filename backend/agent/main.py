import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

from agent import campus_agent

load_dotenv()

app = FastAPI(title="CampusOS AI Agent Service", version="1.0.0")

# Enable CORS for direct frontend interaction or Express proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    try:
        initial_state = {"messages": [HumanMessage(content=req.message)]}
        final_state = campus_agent.invoke(initial_state)
        last_message = final_state["messages"][-1]
        
        return ChatResponse(response=last_message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AGENT_PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)