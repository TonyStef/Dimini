import openai
import numpy as np
import logging
from typing import List, Tuple, Dict, Optional
from app.config import settings
from app.models.graph import GraphNodeResponse

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

class SemanticLinker:
    """Calculate semantic similarity between entities using embeddings"""
    
    def __init__(self, threshold: float = None):
        self.threshold = threshold or settings.SIMILARITY_THRESHOLD
        self.embedding_model = settings.EMBEDDING_MODEL
        
    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """
        Generate OpenAI embedding for a text string.
        
        Args:
            text: The entity label or description
            
        Returns:
            List of floats (1536 dimensions for text-embedding-3-small)
        """
        try:
            response = client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            
            embedding = response.data[0].embedding
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding for '{text}': {e}")
            return None
            
    async def get_embeddings_batch(self, texts: List[str]) -> Dict[str, List[float]]:
        """
        Generate embeddings for multiple texts in a single API call.
        
        Args:
            texts: List of text strings
            
        Returns:
            Dictionary mapping text to embedding
        """
        if not texts:
            return {}
            
        try:
            response = client.embeddings.create(
                model=self.embedding_model,
                input=texts
            )
            
            # Map texts to their embeddings
            embeddings = {}
            for i, text in enumerate(texts):
                embeddings[text] = response.data[i].embedding
                
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return {}
            
    def cosine_similarity(self, embedding_a: List[float], embedding_b: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Formula: cos(θ) = (A · B) / (||A|| * ||B||)
        Result: -1.0 to 1.0 (higher = more similar)
        
        Args:
            embedding_a: First embedding vector
            embedding_b: Second embedding vector
            
        Returns:
            Similarity score (0.0 to 1.0, normalized)
        """
        a = np.array(embedding_a)
        b = np.array(embedding_b)
        
        # Calculate cosine similarity
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        # Avoid division by zero
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        similarity = dot_product / (norm_a * norm_b)
        
        # Normalize from [-1, 1] to [0, 1]
        normalized_similarity = (similarity + 1) / 2
        
        return float(normalized_similarity)
        
    async def find_related_nodes(
        self,
        new_node: Dict[str, any],
        existing_nodes: List[Dict[str, any]]
    ) -> List[Tuple[str, float]]:
        """
        Find which existing nodes should connect to the new node.
        
        Args:
            new_node: {"node_id": "anxiety", "embedding": [...], ...}
            existing_nodes: List of existing nodes with embeddings
            
        Returns:
            List of (node_id, similarity_score) tuples for nodes above threshold
        """
        if not new_node.get("embedding") or not existing_nodes:
            return []
            
        new_embedding = new_node["embedding"]
        related_nodes = []
        
        for existing_node in existing_nodes:
            # Skip self-comparison
            if existing_node.get("node_id") == new_node.get("node_id"):
                continue
                
            # Skip if no embedding
            if not existing_node.get("embedding"):
                continue
                
            existing_embedding = existing_node["embedding"]
            
            # Calculate similarity
            similarity = self.cosine_similarity(new_embedding, existing_embedding)
            
            # Add if above threshold
            if similarity >= self.threshold:
                related_nodes.append((existing_node["node_id"], similarity))
                
        # Sort by similarity (highest first)
        related_nodes.sort(key=lambda x: x[1], reverse=True)
        
        logger.info(f"Found {len(related_nodes)} related nodes for '{new_node.get('node_id')}' above threshold {self.threshold}")
        
        return related_nodes
        
    async def calculate_all_similarities(
        self,
        nodes: List[Dict[str, any]]
    ) -> List[Tuple[str, str, float]]:
        """
        Calculate similarities between all pairs of nodes.
        
        Args:
            nodes: List of nodes with embeddings
            
        Returns:
            List of (source_id, target_id, similarity_score) tuples above threshold
        """
        if len(nodes) < 2:
            return []
            
        similarities = []
        
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                node_a = nodes[i]
                node_b = nodes[j]
                
                if not node_a.get("embedding") or not node_b.get("embedding"):
                    continue
                    
                similarity = self.cosine_similarity(
                    node_a["embedding"],
                    node_b["embedding"]
                )
                
                if similarity >= self.threshold:
                    similarities.append((
                        node_a["node_id"],
                        node_b["node_id"],
                        similarity
                    ))
                    
        logger.info(f"Calculated {len(similarities)} similarities above threshold from {len(nodes)} nodes")
        
        return similarities
