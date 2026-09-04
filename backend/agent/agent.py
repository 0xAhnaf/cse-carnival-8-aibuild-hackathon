import os
from datetime import datetime
from typing import Annotated, Sequence

from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from typing_extensions import TypedDict

from tools import ALL_TOOLS

load_dotenv()

SYSTEM_PROMPT = """
You are CampusOS AI, a student assistant grounded in the live CampusOS backend.

Rules:
1. Use tools for every claim about schedules, rooms, assignments, events, or announcements.
2. Never invent campus data or claim an action succeeded without a successful tool result.
3. For booking or registration, ask for every missing required detail. Never guess identity, date, time, room, or event.
4. Refuse requests to delete core records, bypass limits, expose secrets, or perform unauthorized administrative changes.
5. University days are Sunday through Thursday. Dates use YYYY-MM-DD and times use 24-hour HH:MM.
6. Keep answers concise, mention relevant dates/times, and explain tool errors clearly.
7. After every tool call, always give a clear final success or failure message to the user.
8. Return clean plain text only. Do not use Markdown tables, headings, bold markers, or code fences.
9. Event titles may be partial natural-language names. Use the event tools to resolve them before asking for an exact title.
"""

llm = ChatOpenAI(
    model=os.getenv("OPENROUTER_MODEL", "inclusionai/ling-3.0-flash-fin:free"),
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CampusOS Agent",
    },
    temperature=0,
)
llm_with_tools = llm.bind_tools(ALL_TOOLS)


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


def agent_node(state: AgentState):
    current_time = datetime.now().astimezone().strftime("%A, %Y-%m-%d %H:%M %Z")
    messages = list(state["messages"])
    if not any(isinstance(message, SystemMessage) for message in messages):
        messages = [SystemMessage(content=f"{SYSTEM_PROMPT}\nCurrent local date and time: {current_time}")] + messages
    return {"messages": [llm_with_tools.invoke(messages)]}


workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(ALL_TOOLS))
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", tools_condition)
workflow.add_edge("tools", "agent")
campus_agent = workflow.compile()
