from rasa.core.information_retrieval import InformationRetrieval, SearchResultList, SearchResult
from rasa.utils.endpoints import EndpointConfig
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from typing import Text, Any
import os

class ActiveFilteredQdrantRetriever(InformationRetrieval):
    """Custom Retriever chỉ lấy documents có active=true"""
    
    def connect(self, config: EndpointConfig) -> None:
        """Kết nối đến Qdrant Cloud"""
        host = config.kwargs.get("host") or os.getenv("QDRANT_HOST")
        port = config.kwargs.get("port", 6333)
        api_key = config.kwargs.get("api_key") or os.getenv("QDRANT_API_KEY")
        
        self.client = QdrantClient(
            url=f"https://{host}",
            port=port,
            api_key=api_key,
            https=True
        )
        
        self.collection = config.kwargs.get("collection") or os.getenv("QDRANT_COLLECTION", "rasa_knowledge")
        self.content_key = config.kwargs.get("content_payload_key", "page_content")
        self.metadata_key = config.kwargs.get("metadata_payload_key", "metadata")
        
        print(f"✓ Đã kết nối Qdrant Cloud - Collection: {self.collection}")
    
    def _extract_user_message(self, tracker_state: dict[Text, Any]) -> Text:
        """
        Trích xuất CHỈ user message cuối cùng từ tracker state
        """
        # Lấy latest_message từ tracker_state
        latest_message = tracker_state.get("latest_message", {})
        user_text = latest_message.get("text", "")
        
        # Nếu không có text, thử lấy từ events
        if not user_text:
            events = tracker_state.get("events", [])
            # Lọc ngược từ cuối để tìm user event gần nhất
            for event in reversed(events):
                if event.get("event") == "user":
                    user_text = event.get("text", "")
                    if user_text:
                        break
        
        return user_text.strip()
    
    async def search(
        self, 
        query: Text, 
        tracker_state: dict[Text, Any], 
        threshold: float = 0.0
    ) -> SearchResultList:
        """Tìm kiếm documents với filter active=true"""
        
        # ✅ Lấy CHỈ user message cuối cùng
        user_query = self._extract_user_message(tracker_state)
        
        # Fallback về query gốc nếu không tìm thấy user message
        if not user_query:
            user_query = query
        
        print(f"🔍 Original query: '{query}'")
        print(f"🔍 Cleaned user query: '{user_query}' | Threshold: {threshold}")
        
        # Embed CHỈ user query
        query_vector = self.embeddings.embed_query(user_query)
        
        # Filter active=true
        filters = Filter(
            must=[
                FieldCondition(
                    key="metadata.active",
                    match=MatchValue(value=True)
                )
            ]
        )
        
        print(f"🔍 Filter: metadata.active=True")
        
        try:
            search_results = self.client.search(
                collection_name=self.collection,
                query_vector=query_vector,
                query_filter=filters,
                limit=5,
                score_threshold=threshold
            )
            
            print(f"🔍 Số kết quả: {len(search_results)}")
            
            for i, hit in enumerate(search_results, 1):
                metadata = hit.payload.get(self.metadata_key, {})
                print(f"  {i}. {metadata.get('title')} | active={metadata.get('active')} | score={hit.score:.3f}")
            
            results = [
                SearchResult(
                    text=hit.payload.get(self.content_key, ""),
                    metadata=hit.payload.get(self.metadata_key, {}),
                    score=hit.score
                )
                for hit in search_results
            ]
            
            return SearchResultList(
                results=results, 
                metadata={
                    "filtered_by": "metadata.active=true",
                    "user_query": user_query,
                    "result_count": len(results)
                }
            )
            
        except Exception as e:
            print(f"❌ Lỗi search: {e}")
            import traceback
            traceback.print_exc()
            return SearchResultList(results=[], metadata={"error": str(e)})