from together import Together
import json
import logging
from typing import Dict, List
from app.config import settings
from app.models.graph import ExtractedEntity, EntityExtractionResult, NodeType

logger = logging.getLogger(__name__)

# Initialize Together AI client
client = Together(api_key=settings.TOGETHER_API_KEY)

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
- Each entity should be distinct and meaningful in the therapy context

IMPORTANT: Respond ONLY with a valid JSON object in this exact format:
{
  "entities": [
    {
      "node_id": "anxiety",
      "node_type": "emotion",
      "label": "Anxiety",
      "context": "mentioned in relation to work"
    }
  ]
}

Do not include any other text, explanations, or markdown formatting. Just the raw JSON."""
        
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
                model="moonshotai/Kimi-K2-Thinking",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Extract entities from this therapy conversation:\n\n{transcript_chunk}"}
                ],
                temperature=0.3,  # Low temperature for consistent extraction
                max_tokens=2000  # Increased for thinking model (reasoning + answer)
            )

            # Parse JSON response
            logger.info(f"Together AI Response: {response}")
            content = response.choices[0].message.content
            if not content:
                logger.warning(f"No content in response. Full response: {response}")
                logger.warning(f"Response dict: {response.model_dump() if hasattr(response, 'model_dump') else str(response)}")
                return EntityExtractionResult(entities=[])

            # Clean up any markdown formatting if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            result = json.loads(content)
            
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
