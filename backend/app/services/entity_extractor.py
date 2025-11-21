import openai
import json
import logging
from typing import Dict, List
from app.config import settings
from app.models.graph import ExtractedEntity, EntityExtractionResult, NodeType

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

class EntityExtractor:
    """Extract topics and emotions from therapy transcripts using GPT-4"""
    
    def __init__(self):
        self.system_prompt = """You are a therapy session analyzer. Extract psychological entities from therapy conversations.

Focus on:
- TOPICS: Concrete subjects discussed (work, girlfriend, family, therapy, childhood, career, health, etc.)
- EMOTIONS: Emotional states expressed (anxiety, joy, anger, sadness, hope, frustration, fear, relief, etc.)

Rules:
- Use simple, normalized IDs (lowercase, underscores): "work_stress", "anxiety", "girlfriend"
- Use clear, title-case labels for display: "Work Stress", "Anxiety", "Girlfriend"
- Only extract entities EXPLICITLY mentioned in the text
- Avoid inferring entities not clearly discussed
- Each entity should be distinct and meaningful in the therapy context"""

        self.function_schema = {
            "name": "extract_therapy_entities",
            "description": "Extract topics and emotions from therapy conversation",
            "parameters": {
                "type": "object",
                "properties": {
                    "entities": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "node_id": {
                                    "type": "string",
                                    "description": "Normalized ID (lowercase, underscores): 'anxiety', 'work_stress'"
                                },
                                "node_type": {
                                    "type": "string",
                                    "enum": ["topic", "emotion"],
                                    "description": "Is this a topic or emotion?"
                                },
                                "label": {
                                    "type": "string",
                                    "description": "Display label (title case): 'Anxiety', 'Work Stress'"
                                },
                                "context": {
                                    "type": "string",
                                    "description": "Brief context of how it was mentioned"
                                }
                            },
                            "required": ["node_id", "node_type", "label"]
                        }
                    }
                },
                "required": ["entities"]
            }
        }
        
    async def extract(self, transcript_chunk: str) -> EntityExtractionResult:
        """
        Extract entities from a transcript chunk.
        
        Args:
            transcript_chunk: 30-second segment of therapy conversation
            
        Returns:
            EntityExtractionResult with extracted entities
        """
        if not transcript_chunk or not transcript_chunk.strip():
            return EntityExtractionResult(entities=[])
            
        try:
            logger.info(f"Extracting entities from chunk: {transcript_chunk[:100]}...")
            
            response = client.chat.completions.create(
                model=settings.GPT_MODEL,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Extract entities from this therapy conversation:\n\n{transcript_chunk}"}
                ],
                functions=[self.function_schema],
                function_call={"name": "extract_therapy_entities"},
                temperature=0.3,  # Low temperature for consistent extraction
                max_tokens=500
            )
            
            # Parse function call result
            function_call = response.choices[0].message.function_call
            if not function_call:
                logger.warning("No function call in response")
                return EntityExtractionResult(entities=[])
                
            result = json.loads(function_call.arguments)
            
            # Convert to ExtractedEntity objects
            entities = []
            for entity_data in result.get("entities", []):
                try:
                    # Map string node_type to enum
                    node_type = NodeType.TOPIC if entity_data["node_type"] == "topic" else NodeType.EMOTION
                    
                    entity = ExtractedEntity(
                        node_id=entity_data["node_id"],
                        node_type=node_type,
                        label=entity_data["label"],
                        context=entity_data.get("context")
                    )
                    entities.append(entity)
                except Exception as e:
                    logger.error(f"Error parsing entity: {e}, data: {entity_data}")
                    
            logger.info(f"Extracted {len(entities)} entities")
            return EntityExtractionResult(entities=entities)
            
        except Exception as e:
            logger.error(f"Error in entity extraction: {e}")
            return EntityExtractionResult(entities=[])
            
    async def extract_batch(self, transcript_chunks: List[str]) -> List[EntityExtractionResult]:
        """
        Extract entities from multiple transcript chunks.
        
        Args:
            transcript_chunks: List of transcript segments
            
        Returns:
            List of EntityExtractionResult
        """
        results = []
        for chunk in transcript_chunks:
            result = await self.extract(chunk)
            results.append(result)
        return results
