from pydantic import Field
from datetime import datetime
from typing import List, Dict, Any, Optional
from enum import Enum

from app.models.base import DiminiBaseModel

class NodeType(str, Enum):
    TOPIC = "TOPIC"
    EMOTION = "EMOTION"

class GraphNodeBase(DiminiBaseModel):
    node_id: str
    node_type: NodeType
    label: str
    properties: Dict[str, Any] = Field(default_factory=dict)

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

class GraphEdgeBase(DiminiBaseModel):
    source_node_id: str
    target_node_id: str
    similarity_score: float
    relationship_type: str = "related_to"
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdgeCreate(GraphEdgeBase):
    pass

class GraphEdgeResponse(GraphEdgeBase):
    id: str
    session_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class GraphData(DiminiBaseModel):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]

# Entity extraction models
class ExtractedEntity(DiminiBaseModel):
    node_id: str
    node_type: NodeType
    label: str
    context: Optional[str] = None

class EntityExtractionResult(DiminiBaseModel):
    entities: List[ExtractedEntity]

# Frontend graph format
class FrontendNode(DiminiBaseModel):
    id: str  # node_id
    label: str
    type: str  # 'topic' or 'emotion'
    group: int  # 1 = emotion, 2 = topic

class FrontendEdge(DiminiBaseModel):
    source: str  # node_id
    target: str  # node_id
    value: float  # similarity_score

class FrontendGraphData(DiminiBaseModel):
    nodes: List[FrontendNode]
    links: List[FrontendEdge]
