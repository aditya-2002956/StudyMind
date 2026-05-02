from fastapi import APIRouter

from app.schemas.study import MaterialSearchRequest, MaterialSearchResponse
from app.services.materials_service import search_materials

router = APIRouter()


@router.post("/search", response_model=MaterialSearchResponse)
def search(payload: MaterialSearchRequest) -> MaterialSearchResponse:
    return search_materials(payload)
