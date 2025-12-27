# import os

# docs_folder = "docs"
# os.makedirs(docs_folder, exist_ok=True)

# files = {
#     "hang-tin.txt": """Cac hang tin trong he thong:
# - Hang VIP: Hien thi uu tien dau trang
# - Hang Thuong: Hien thi binh thuong
# - Hang Mien phi: Gioi han thoi gian
# """,
#     "huong-dan-property.txt": """Huong dan tao property:
# - Dang nhap vao he thong
# - Chon menu Property > Tao moi
# - Dien thong tin day du
# - Upload hinh anh
# - Nhan Dang tin
# """,
#     "dang-ky-goi.txt": """Huong dan dang ky goi:
# - Vao Tai khoan > Goi dich vu
# - Chon goi phu hop
# - Chon phuong thuc thanh toan
# - Xac nhan va thanh toan
# """
# }

# for filename, content in files.items():
#     filepath = os.path.join(docs_folder, filename)
#     with open(filepath, 'w', encoding='utf-8') as f:
#         f.write(content)
#     print(f"Đã tạo: {filepath}")

# print("\nHoàn tất! Bây giờ chạy: rasa train")

# import os
# from qdrant_client import QdrantClient
# from langchain_qdrant import QdrantVectorStore
# from langchain_google_genai import GoogleGenerativeAIEmbeddings
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain_core.documents import Document

# # =========================
# # 1. Kết nối Qdrant Cloud
# # =========================
# client = QdrantClient(
#     url="https://47672428-0a38-4050-8637-d4c48b3012f8.europe-west3-0.gcp.cloud.qdrant.io:6333",
#     api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.wenti9M4RSnZod1uUkO2AYg3VoaqAqRppCc1ThqMNM8",
# )

# print("Collections hiện có:", client.get_collections())

# # =========================
# # 2. Khởi tạo Gemini Embedding
# # =========================
# embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/text-embedding-004",
#     google_api_key="AIzaSyCD48E76gbPImw0Ln268L40OpTHvAlmBkg"
# )

# # =========================
# # 3. Đọc tài liệu
# # =========================
# docs_path = "./docs"
# documents = []

# for filename in os.listdir(docs_path):
#     if filename.endswith(".txt"):
#         with open(os.path.join(docs_path, filename), "r", encoding="utf-8") as f:
#             documents.append(
#                 Document(
#                     page_content=f.read(),
#                     metadata={"source": filename}
#                 )
#             )

# # =========================
# # 4. Chia nhỏ tài liệu
# # =========================
# text_splitter = RecursiveCharacterTextSplitter(
#     chunk_size=1000,
#     chunk_overlap=200
# )

# split_docs = text_splitter.split_documents(documents)

# # =========================
# # 5. Đẩy lên Qdrant Cloud
# # =========================
# collection_name = "rasa_knowledge_base"

# vector_store = QdrantVectorStore.from_documents(
#     documents=split_docs,
#     embedding=embeddings,
#     url="https://47672428-0a38-4050-8637-d4c48b3012f8.europe-west3-0.gcp.cloud.qdrant.io:6333",
#     api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.wenti9M4RSnZod1uUkO2AYg3VoaqAqRppCc1ThqMNM8",
#     collection_name=collection_name,
#     content_payload_key="page_content",
#     metadata_payload_key="metadata"
# )

# print(f"✅ Đã đẩy {len(split_docs)} chunks vào collection '{collection_name}'")

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from langchain.embeddings import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

client = QdrantClient(
    url=f"https://{os.getenv('QDRANT_HOST')}",
    api_key=os.getenv("QDRANT_API_KEY"),
    https=True
)

embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
collection = os.getenv("QDRANT_COLLECTION")

# Test query
query = "giới hạn đăng tin"
query_vector = embeddings.embed_query(query)

print("=== Test 1: KHÔNG filter (sẽ trả cả active=false) ===")
results_no_filter = client.search(
    collection_name=collection,
    query_vector=query_vector,
    limit=5
)
print(f"Tìm thấy {len(results_no_filter)} kết quả:")
for hit in results_no_filter:
    active = hit.payload.get("metadata", {}).get("active")
    title = hit.payload.get("metadata", {}).get("title")
    print(f"  - {title} | active={active} | score={hit.score:.3f}")

print("\n=== Test 2: CÓ filter active=true ===")
results_filtered = client.search(
    collection_name=collection,
    query_vector=query_vector,
    query_filter=Filter(
        must=[
            FieldCondition(
                key="active",
                match=MatchValue(value=True)
            )
        ]
    ),
    limit=5
)
print(f"Tìm thấy {len(results_filtered)} kết quả:")
for hit in results_filtered:
    active = hit.payload.get("metadata", {}).get("active")
    title = hit.payload.get("metadata", {}).get("title")
    print(f"  - {title} | active={active} | score={hit.score:.3f}")