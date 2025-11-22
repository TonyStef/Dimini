"""
Context templates for different therapy stages.
Adapted from brian_agent/prompts/context_templates.py

Reuse: 100% structure
Adaptation: Real estate → Therapy
"""

THERAPY_CONTEXT_TEMPLATES = {
    "SESSION_START": """
**CURRENT STAGE: Session Introduction**

Patient Context:
{patient_context}

Previous Session Summary:
{previous_session_summary}

Today's Session Goals:
- Assess current emotional state
- Follow up on previous session homework
- Identify new topics or concerns

Operational Mode:
- You are in LISTENING mode by default
- ONLY respond when therapist directly asks you a question
- Continuously analyze emotions and update knowledge graph
- Be empathetic and supportive in your responses
""",

    "ACTIVE_LISTENING": """
**CURRENT STAGE: Active Listening & Real-time Analysis**

Current Session Data:
- Duration: {session_duration} minutes
- Detected emotions: {current_emotions}
- Topics discussed: {topics}

Knowledge Graph Updates:
- New nodes created: {new_nodes_count}
- Significant patterns detected: {patterns}

Instructions:
- Continue passive listening
- Update KG for significant emotional events
- Flag concerning patterns using flag_concern tool
- ONLY speak when therapist asks for insights
""",

    "THERAPIST_QUERY": """
**CURRENT STAGE: Responding to Therapist Query**

Therapist Question: {therapist_question}

Available Context:
- Current session insights: {session_insights}
- Patient history: {patient_history}
- Knowledge graph state: {kg_state}

Response Guidelines:
- Provide concise, professional insights
- Reference specific emotional patterns from KG
- Suggest therapeutic approaches if appropriate
- Return to LISTENING mode after response
""",

    "SESSION_CLOSING": """
**CURRENT STAGE: Session Summary & Next Steps**

Session Statistics:
- Duration: {total_duration} minutes
- Primary emotions: {primary_emotions}
- Key topics covered: {key_topics}
- Breakthrough moments: {breakthroughs}

Knowledge Graph Changes:
- Nodes added: {nodes_added}
- New connections: {edges_added}
- Updated relationships: {relationships_updated}

Next Session Preparation:
- Recommended follow-up topics: {follow_up_topics}
- Homework suggestions: {homework}
- Risk factors to monitor: {risk_factors}
"""
}


def format_therapy_context(
    patient_history: Dict,
    previous_sessions: List[Dict],
    current_stage: str = "SESSION_START"
) -> str:
    """
    Format complete therapy context for Hume injection.

    Args:
        patient_history: Patient background and history
        previous_sessions: List of recent session summaries
        current_stage: Current therapy stage

    Returns:
        Formatted context string
    """
    template = THERAPY_CONTEXT_TEMPLATES[current_stage]

    # Format previous session summary
    if previous_sessions:
        last_session = previous_sessions[0]
        prev_summary = f"""
Session Date: {last_session['date']}
Summary: {last_session['summary']}
Homework Assigned: {last_session.get('homework', 'None')}
"""
    else:
        prev_summary = "This is the first session with this patient."

    # Format patient context
    patient_context = f"""
Name: {patient_history.get('name')}
Background: {patient_history.get('background', 'No background available')}
Known Triggers: {', '.join(patient_history.get('triggers', []))}
Therapy Goals: {', '.join(patient_history.get('therapy_goals', []))}
"""

    # Inject into template
    return template.format(
        patient_context=patient_context,
        previous_session_summary=prev_summary,
        session_duration=0,
        current_emotions=[],
        topics=[],
        new_nodes_count=0,
        patterns=[]
    )
