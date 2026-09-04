import os
from typing import Annotated, Sequence
from typing_extensions import TypedDict
from dotenv import load_dotenv

from langchain_core.messages import BaseMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from tools import ALL_TOOLS

load_dotenv()

SYSTEM_PROMPT = """
You are CampusOS AI, the official student assistant powered by real-time university data.

OPERATIONAL RULES:
1. ALWAYS rely on tools to answer questions regarding schedules, rooms, assignments, events, or announcements. Never make up data.
2. AMBIGUITY HANDLING: If a user request is vague (e.g. "Book me any room tomorrow", "Register me for an event"), DO NOT execute a action tool with guessed parameters. Ask the user polite clarifying questions to obtain missing details (e.g., exact time, room number, event ID, student name/ID).
3. UNAUTHORIZED / MALICIOUS REQUESTS: Politely refuse requests to delete database records, alter admin settings, bypass system limits, or reveal confidential backend information.
4. TIME CONVENTIONS: University operational days are Sunday through Thursday (Friday/Saturday are weekend). All times follow 24-hour format (HH:MM) and dates use ISO 8601 (YYYY-MM-DD).
5. Synthesize answers concisely and directly based on retrieved tool results.
"""

# Initialize OpenRouter LLM Client
llm = ChatOpenAI(
    model="inclusionai/ling-3.0-flash-fin:free",
    openai_api_key=os.getenv("OPENROUTER_API_KEY"),
    openai_api_base="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CampusOS Agent",
    },
    temperature=0
)

llm_with_tools = llm.bind_tools(ALL_TOOLS)

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

def agent_node(state: AgentState):
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
    
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

# Compile StateGraph Workflow
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", ToolNode(ALL_TOOLS))

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", tools_condition)
workflow.add_edge("tools", "agent")

campus_agent = workflow.compile()