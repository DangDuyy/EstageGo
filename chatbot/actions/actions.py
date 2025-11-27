# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


# This is a simple example for a custom action which utters "Hello World!"

# from typing import Any, Text, Dict, List
#
# from rasa_sdk import Action, Tracker
# from rasa_sdk.executor import CollectingDispatcher
#
#
# class ActionHelloWorld(Action):
#
#     def name(self) -> Text:
#         return "action_hello_world"
#
#     def run(self, dispatcher: CollectingDispatcher,
#             tracker: Tracker,
#             domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
#
#         dispatcher.utter_message(text="Hello World!")
#
#         return []

from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os


class ActionSearchProperty(Action):
    """Custom action để tìm kiếm bất động sản trong MongoDB"""

    def name(self) -> Text:
        return "action_search_property"

    def __init__(self):
        # Kết nối MongoDB
        mongo_uri = os.getenv("MONGODB_URI", "mongodb+srv://duy:duy@cluster0-dangduy.gaza0lq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-DangDuy")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["estageGo"]  # Database name
        self.collection = self.db["properties"]  # Collection name

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Lấy thông tin từ slots
        province = tracker.get_slot("province")
        district = tracker.get_slot("district")
        ward = tracker.get_slot("ward")

        # Kiểm tra kết nối MongoDB
        try:
            self.client.admin.command('ping')
        except ConnectionFailure:
            dispatcher.utter_message(
                text="Xin lỗi, không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau."
            )
            return []

        # Xây dựng query MongoDB
        query = {}
        
        if province:
            query["address.province"] = {"$regex": province, "$options": "i"}
        
        if district:
            query["address.district"] = {"$regex": district, "$options": "i"}
        
        if ward:
            query["address.ward"] = {"$regex": ward, "$options": "i"}

        # Nếu không có thông tin vị trí nào
        if not query:
            dispatcher.utter_message(text="Bạn muốn tìm nhà ở khu vực nào? Vui lòng cung cấp địa chỉ cụ thể hơn.")
            return []

        # Thông báo đang tìm kiếm
        location_info = []
        if province:
            location_info.append(f"Tỉnh/TP: {province}")
        if district:
            location_info.append(f"Quận/Huyện: {district}")
        if ward:
            location_info.append(f"Phường/Xã: {ward}")
        
        dispatcher.utter_message(
            text=f"Đang tìm kiếm bất động sản với thông tin:\n" + "\n".join(location_info)
        )

        # Truy vấn MongoDB
        try:
            results = list(self.collection.find(query).limit(5))
            
            print(f"Query: {query}, Results found: {len(results)}")  # Debug log
            print(f"Results: {results}")  # Debug log
            
            if not results:
                dispatcher.utter_message(
                    text="Rất tiếc, tôi không tìm thấy bất động sản nào phù hợp với yêu cầu của bạn."
                )
                return []
            
            # Hiển thị kết quả
            dispatcher.utter_message(
                text=f"Tìm thấy {len(results)} bất động sản phù hợp:"
            )
            
            for idx, prop in enumerate(results, 1):
                message = f"\n🏠 Bất động sản #{idx}\n"
                message += f"📍 Địa chỉ: {prop.get('address', 'N/A')}\n"
                message += f"   {prop.get('ward', '')}, {prop.get('district', '')}, {prop.get('province', '')}\n"
                message += f"💰 Giá: {prop.get('price', 'N/A')}\n"
                message += f"📐 Diện tích: {prop.get('area', 'N/A')} m²\n"
                message += f"🛏️  Phòng ngủ: {prop.get('bedrooms', 'N/A')}\n"
                message += f"🚿 Phòng tắm: {prop.get('bathrooms', 'N/A')}\n"
                
                if prop.get('description'):
                    message += f"📝 Mô tả: {prop.get('description')[:100]}...\n"
                
                dispatcher.utter_message(text=message)
            
        except Exception as e:
            dispatcher.utter_message(
                text=f"Đã xảy ra lỗi khi tìm kiếm: {str(e)}"
            )
            return []

        return []


class ActionHelloWorld(Action):
    """Example action - có thể xóa nếu không cần"""

    def name(self) -> Text:
        return "action_hello_world"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:

        dispatcher.utter_message(text="Hello World!")
        return []
