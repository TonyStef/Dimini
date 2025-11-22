"""Common base class for Pydantic models used across the backend."""

from pydantic import BaseModel, ConfigDict


class DiminiBaseModel(BaseModel):
    """Disable the reserved `model_` prefix so we can use friendly field names."""

    model_config = ConfigDict(protected_namespaces=())


