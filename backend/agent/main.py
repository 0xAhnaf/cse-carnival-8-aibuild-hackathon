import os
import json
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from pydantic import BaseModel, Field

from agent import campus_agent

load_dotenv()
app = FastAPI(title="CampusOS AI Agent Service", version="1.0.0")


class ChatRequest(BaseModel):
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    message: str


def tool_result_fallback(messages):
    tool_message = next((item for item in reversed(messages) if isinstance(item, ToolMessage)), None)
    if tool_message is None:
        return "The assistant returned an empty response. Please try again."
    if isinstance(tool_message.content, dict):
        result = tool_message.content
    else:
        try:
            result = json.loads(str(tool_message.content))
        except (TypeError, ValueError):
            result = {}
    if result.get("success") is False:
        return result.get("error", "The requested action could not be completed.")
    tool_name = getattr(tool_message, "name", "") or ""
    if tool_name == "register_for_event":
        return f"Registration for {result.get('event', 'the event')} completed successfully."
    if tool_name == "cancel_event_registration":
        return result.get("message", "The event registration was cancelled successfully.")
    if tool_name == "book_room":
        return f"Room {result.get('room', '')} was booked successfully.".replace("  ", " ")
    if tool_name == "cancel_room_booking":
        return result.get("message", "The room booking was cancelled successfully.")
    return "I retrieved the campus data, but could not format the response. Please try again."


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    history = []
    for item in request.context.get("conversation", [])[-12:]:
        content = str(item.get("content", "")).strip()
        if content:
            history.append(HumanMessage(content=content) if item.get("role") == "user" else AIMessage(content=content))
    history.append(HumanMessage(content=message))
    try:
        final_state = campus_agent.invoke({"messages": history})
        messages = final_state["messages"]
        content = str(messages[-1].content).strip()
        return ChatResponse(message=content or tool_result_fallback(messages))
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Agent request failed: {error}") from error


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=int(os.getenv("AGENT_PORT", "8001")), reload=False)
