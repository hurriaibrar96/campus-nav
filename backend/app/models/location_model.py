from pydantic import BaseModel
from typing import Dict

class LocationModel(BaseModel):
    node_id: str
    label: str
    x: float
    y: float
    neighbors: Dict[str, int]
