from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any
from enum import Enum

class NodeType(str, Enum):
    TOPIC = "TOPIC"
    EMOTION = "EMOTION"

class GraphNodeBase(BaseModel):
    node_id: str
    node_type: NodeType
    label: str
    properties: Optional[Dict[str, Any]] = {}

class GraphNodeCreate(GraphNodeBase):
    embedding: List[float]
    
class GraphNodeResponse(GraphNodeBase):
    id: str
    session_id: str
    first_mentioned_at: datetime
    mention_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GraphEdgeBase(BaseModel):
    source_node_id: str
    target_node_id: str
    similarity_score: float
    relationship_type: str = "related_to"
    properties: Optional[Dict[str, Any]] = {}

class GraphEdgeCreate(GraphEdgeBase):
    pass

class GraphEdgeResponse(GraphEdgeBase):
    id: str
    session_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class GraphData(BaseModel):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]

# Entity extraction models
class ExtractedEntity(BaseModel):
    node_id: str
    node_type: NodeType
    label: str
    context: Optional[str] = None

class EntityExtractionResult(BaseModel):
    entities: List[ExtractedEntity]

# Frontend graph format
class FrontendNode(BaseModel):
    id: str  # node_id
    label: str
    type: str  # 'topic' or 'emotion'
    group: int  # 1 = emotion, 2 = topic

class FrontendEdge(BaseModel):
    source: str  # node_id
    target: str  # node_id
    value: float  # similarity_score

class FrontendGraphData(BaseModel):
    nodes: List[FrontendNode]
    links: List[FrontendEdge]
