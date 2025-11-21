import openai
import json
import logging
from typing import Dict, List, Optional
from app.config import settings
from app.database import db
from app.models.session import SessionSummary

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

class SessionAnalyzer:
    """Generate AI-powered summaries and insights for therapy sessions"""
    
    def __init__(self):
        self.system_prompt = """You are an expert therapy session analyzer. Generate comprehensive summaries of therapy sessions based on the transcript and extracted semantic graph data.

Your analysis should:
1. Identify key topics and themes discussed
2. Note emotional patterns and changes throughout the session
3. Provide clinical insights about relationships between topics and emotions
4. Suggest areas for follow-up in future sessions
5. Note any significant breakthroughs or concerns

Be professional, empathetic, and focused on therapeutic value."""

        self.function_schema = {
            "name": "generate_session_summary",
            "description": "Generate a comprehensive therapy session summary",
            "parameters": {
                "type": "object",
                "properties": {
                    "key_topics": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Main topics discussed in order of importance"
                    },
                    "emotional_themes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Predominant emotional themes observed"
                    },
                    "insights": {
                        "type": "string",
                        "description": "Clinical insights about the session"
                    },
                    "recommendations": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Recommendations for follow-up or future sessions"
                    },
                    "progress_notes": {
                        "type": "string",
                        "description": "Notes on patient progress or areas of concern"
                    }
                },
                "required": ["key_topics", "emotional_themes", "insights", "recommendations"]
            }
        }
        
    async def analyze_session(self, session_id: str) -> Optional[SessionSummary]:
        """
        Generate a comprehensive summary of a therapy session.
        
        Args:
            session_id: Session ID to analyze
            
        Returns:
            SessionSummary object or None if analysis fails
        """
        try:
            # Fetch session with transcript
            session = await db.session.find_unique(
                where={"id": session_id}
            )
            
            if not session or not session.transcript:
                logger.warning(f"Session {session_id} not found or has no transcript")
                return None
                
            # Fetch graph data for context
            nodes = await db.graphnode.find_many(
                where={"sessionId": session_id},
                order=[{"mentionCount": "desc"}, {"nodeType": "asc"}]
            )
            
            edges = await db.graphedge.find_many(
                where={"sessionId": session_id},
                order={"similarityScore": "desc"},
                take=10  # Top 10 strongest connections
            )
            
            # Build context for analysis
            topics = [n.label for n in nodes if n.nodeType == "TOPIC"][:10]
            emotions = [n.label for n in nodes if n.nodeType == "EMOTION"][:10]
            
            # Build connections summary
            connections = []
            for edge in edges:
                source = next((n.label for n in nodes if n.nodeId == edge.sourceNodeId), edge.sourceNodeId)
                target = next((n.label for n in nodes if n.nodeId == edge.targetNodeId), edge.targetNodeId)
                connections.append(f"{source} ↔ {target} (strength: {edge.similarityScore:.2f})")
                
            analysis_context = f"""
Session Transcript:
{session.transcript}

Extracted Topics: {', '.join(topics)}
Extracted Emotions: {', '.join(emotions)}
Strong Connections: {'; '.join(connections[:5])}
"""
            
            logger.info(f"Analyzing session {session_id} with {len(nodes)} nodes and {len(edges)} edges")
            
            # Generate analysis
            response = client.chat.completions.create(
                model=settings.GPT_MODEL,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Analyze this therapy session:\n\n{analysis_context}"}
                ],
                functions=[self.function_schema],
                function_call={"name": "generate_session_summary"},
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse response
            function_call = response.choices[0].message.function_call
            if not function_call:
                logger.warning("No function call in response")
                return None
                
            result = json.loads(function_call.arguments)
            
            summary = SessionSummary(
                key_topics=result.get("key_topics", []),
                emotional_themes=result.get("emotional_themes", []),
                insights=result.get("insights", ""),
                recommendations=result.get("recommendations", []),
                progress_notes=result.get("progress_notes")
            )
            
            # Update session with summary
            await db.session.update(
                where={"id": session_id},
                data={"summary": summary.model_dump()}
            )
            
            logger.info(f"Generated summary for session {session_id}")
            return summary
            
        except Exception as e:
            logger.error(f"Error analyzing session {session_id}: {e}")
            return None
            
    async def get_session_insights(self, session_id: str) -> Dict[str, any]:
        """
        Get quick insights about a session without full analysis.
        
        Args:
            session_id: Session ID
            
        Returns:
            Dictionary with session insights
        """
        try:
            # Get node and edge counts
            node_count = await db.graphnode.count(
                where={"sessionId": session_id}
            )
            
            edge_count = await db.graphedge.count(
                where={"sessionId": session_id}
            )
            
            # Get most mentioned nodes
            top_nodes = await db.graphnode.find_many(
                where={"sessionId": session_id},
                order={"mentionCount": "desc"},
                take=5
            )
            
            # Get strongest connections
            top_edges = await db.graphedge.find_many(
                where={"sessionId": session_id},
                order={"similarityScore": "desc"},
                take=5
            )
            
            # Build insights
            insights = {
                "total_nodes": node_count,
                "total_edges": edge_count,
                "top_topics": [
                    {"label": n.label, "mentions": n.mentionCount}
                    for n in top_nodes if n.nodeType == "TOPIC"
                ],
                "top_emotions": [
                    {"label": n.label, "mentions": n.mentionCount}
                    for n in top_nodes if n.nodeType == "EMOTION"
                ],
                "strongest_connections": []
            }
            
            # Add connection details
            all_nodes = {n.nodeId: n.label for n in await db.graphnode.find_many(where={"sessionId": session_id})}
            
            for edge in top_edges:
                source_label = all_nodes.get(edge.sourceNodeId, edge.sourceNodeId)
                target_label = all_nodes.get(edge.targetNodeId, edge.targetNodeId)
                insights["strongest_connections"].append({
                    "source": source_label,
                    "target": target_label,
                    "strength": edge.similarityScore
                })
                
            return insights
            
        except Exception as e:
            logger.error(f"Error getting session insights: {e}")
            return {}
