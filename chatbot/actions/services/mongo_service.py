# actions/services/mongo_service.py
from pymongo import MongoClient
import os

def get_db():
    """
    Kết nối MongoDB, lấy database 'estagego_db'.
    Thay đổi MONGO_URI nếu bạn dùng remote DB.
    """
    MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://duy:duy@cluster0-dangduy.gaza0lq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-DangDuy")
    client = MongoClient(MONGO_URI)
    db = client["estageGo"]
    return db
