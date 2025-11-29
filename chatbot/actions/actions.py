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

from typing import Any, Text, Dict, List, Optional
from rasa_sdk import Action, Tracker, FormValidationAction
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict
from rasa_sdk.events import SlotSet, FollowupAction
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
import re


class ValidatePropertySearchForm(FormValidationAction):
    """Validates các slots trong property search form"""

    def name(self) -> Text:
        return "validate_property_search_form"

    # async def required_slots(
    #     self,
    #     domain_slots: List[Text],
    #     dispatcher: CollectingDispatcher,
    #     tracker: Tracker,
    #     domain: DomainDict,
    # ) -> List[Text]:
    #     """Động thái thay đổi required slots"""
        
    #     required_slots = ["province"]
        
    #     # Chỉ hỏi district nếu chưa có district hoặc district không phải "bỏ qua"
    #     district = tracker.get_slot("district")
    #     if not district:
    #         required_slots.append("district")
    #     elif district != "bỏ qua":
    #         # Nếu có district, mới hỏi ward
    #         ward = tracker.get_slot("ward")
    #         if not ward:
    #             required_slots.append("ward")
        
    #     return required_slots

    def validate_province(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate province value"""
        
        # Nếu user nói "bỏ qua" - không cho phép
        if slot_value and slot_value.lower() in ["bỏ qua", "skip", "không cần", "thôi", "không"]:
            dispatcher.utter_message(text="❌ Bạn cần cung cấp ít nhất tỉnh/thành phố để tìm kiếm.")
            return {"province": None}
        
        # Normalize tên tỉnh
        if slot_value:
            # Chuẩn hóa tên
            slot_value = slot_value.strip()
            dispatcher.utter_message(text=f"✓ Tỉnh/TP: {slot_value}")
            return {"province": slot_value}
        
        return {"province": None}

    def validate_district(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate district value"""
        
        # Cho phép bỏ qua district
        if slot_value and slot_value.lower() in ["bỏ qua", "skip", "không cần", "thôi", "không", "ko"]:
            dispatcher.utter_message(text="✓ Sẽ tìm trong toàn tỉnh/thành phố")
            # Set ward cũng là bỏ qua luôn
            return {"district": "bỏ qua"}
        
        if slot_value:
            slot_value = slot_value.strip()
            dispatcher.utter_message(text=f"✓ Quận/Huyện: {slot_value}")
            return {"district": slot_value}
        
        return {"district": None}

    def validate_ward(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[Text, Any]:
        """Validate ward value"""
        
        # Cho phép bỏ qua ward
        if slot_value and slot_value.lower() in ["bỏ qua", "skip", "không cần", "thôi", "không", "ko"]:
            dispatcher.utter_message(text="✓ Sẽ tìm trong toàn quận/huyện")
            return {"ward": "bỏ qua"}
        
        if slot_value:
            slot_value = slot_value.strip()
            dispatcher.utter_message(text=f"✓ Phường/Xã: {slot_value}")
            return {"ward": slot_value}
        
        return {"ward": None}


class ActionAskDistrict(Action):
    """Custom action để hỏi district với option bỏ qua"""

    def name(self) -> Text:
        return "action_ask_district"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        province = tracker.get_slot("province")
        
        if province:
            dispatcher.utter_message(
                text=f"Bạn có muốn chỉ định quận/huyện cụ thể trong {province} không?\n"
                     f"(Nói tên quận/huyện hoặc 'bỏ qua' để tìm toàn {province})"
            )
        else:
            dispatcher.utter_message(
                text="Bạn muốn tìm ở quận/huyện nào?\n(hoặc 'bỏ qua')"
            )
        
        return []


class ActionAskWard(Action):
    """Custom action để hỏi ward với option bỏ qua"""

    def name(self) -> Text:
        return "action_ask_ward"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        district = tracker.get_slot("district")
        
        if district and district != "bỏ qua":
            dispatcher.utter_message(
                text=f"Bạn có muốn chỉ định phường/xã cụ thể trong {district} không?\n"
                     f"(Nói tên phường/xã hoặc 'bỏ qua' để tìm toàn {district})"
            )
        else:
            dispatcher.utter_message(
                text="Bạn có muốn chỉ định phường/xã cụ thể không?\n(hoặc 'bỏ qua')"
            )
        
        return []


class ActionSubmitPropertySearchForm(Action):
    """Action được gọi khi form hoàn thành"""
    
    def name(self) -> Text:
        return "action_submit_property_search_form"
    
    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Chuyển sang action search
        return [FollowupAction("action_search_property")]


class ActionSearchProperty(Action):
    """Custom action để tìm kiếm bất động sản trong MongoDB"""

    def name(self) -> Text:
        return "action_search_property"

    def __init__(self):
        # Kết nối MongoDB
        mongo_uri = os.getenv("MONGODB_URI", "mongodb+srv://duy:duy@cluster0-dangduy.gaza0lq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-DangDuy")
        self.client = MongoClient(mongo_uri)
        self.db = self.client["estageGo"]
        self.collection = self.db["properties"]

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

        print(f"DEBUG - Province: {province}, District: {district}, Ward: {ward}")

        # Kiểm tra kết nối MongoDB
        try:
            self.client.admin.command('ping')
        except ConnectionFailure:
            dispatcher.utter_message(
                text="❌ Xin lỗi, không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau."
            )
            return [SlotSet("province", None), SlotSet("district", None), SlotSet("ward", None)]

        # Xây dựng query MongoDB
        query = {}
        
        # Province là bắt buộc
        if not province:
            dispatcher.utter_message(text="❌ Vui lòng cung cấp ít nhất tỉnh/thành phố để tìm kiếm.")
            return []
        
        query["address.province"] = {"$regex": province, "$options": "i"}
        
        # District là optional
        if district and district != "bỏ qua":
            query["address.district"] = {"$regex": district, "$options": "i"}
        
        # Ward là optional
        if ward and ward != "bỏ qua":
            query["address.ward"] = {"$regex": ward, "$options": "i"}

        # Tạo thông báo tìm kiếm
        location_parts = [province]
        if district and district != "bỏ qua":
            location_parts.append(district)
        if ward and ward != "bỏ qua":
            location_parts.append(ward)
        
        location_text = ", ".join(location_parts)
        
        dispatcher.utter_message(
            text=f"\n{'='*50}\n🔍 TÌM KIẾM BẤT ĐỘNG SẢN\n{'='*50}\n📍 Khu vực: {location_text}\n{'='*50}"
        )

        # Truy vấn MongoDB
        try:
            print(f"DEBUG - MongoDB Query: {query}")
            results = list(self.collection.find(query).limit(10))
            print(f"DEBUG - Found {len(results)} results")
            
            if not results:
                dispatcher.utter_message(
                    text=f"😞 Rất tiếc, không tìm thấy bất động sản nào tại {location_text}.\n\n"
                         f"💡 Gợi ý:\n"
                         f"• Thử tìm kiếm ở khu vực rộng hơn (bỏ qua quận/huyện hoặc phường/xã)\n"
                         f"• Kiểm tra lại tên địa điểm có chính xác không\n"
                         f"• Thử tìm ở tỉnh/thành phố khác\n\n"
                         f"Bạn có muốn tìm kiếm lại không?"
                )
                return [SlotSet("province", None), SlotSet("district", None), SlotSet("ward", None)]
            
            # Hiển thị kết quả
            dispatcher.utter_message(
                text=f"✨ Tìm thấy {len(results)} bất động sản phù hợp:"
            )
            
            for idx, prop in enumerate(results, 1):
                # Tạo địa chỉ đầy đủ
                address_parts = []
                if prop.get('address'):
                    address_parts.append(prop.get('address'))
                if prop.get('ward'):
                    address_parts.append(prop.get('ward'))
                if prop.get('district'):
                    address_parts.append(prop.get('district'))
                if prop.get('province'):
                    address_parts.append(prop.get('province'))
                
                full_address = ", ".join(address_parts)
                
                message = f"\n{'='*50}\n"
                message += f"🏠 BẤT ĐỘNG SẢN #{idx}\n"
                message += f"{'='*50}\n"
                message += f"📍 Địa chỉ: {full_address}\n"
                message += f"💰 Giá: {prop.get('price', 'Liên hệ')}\n"
                message += f"📐 Diện tích: {prop.get('area', 'N/A')} m²\n"
                message += f"🛏️  Phòng ngủ: {prop.get('bedrooms', 'N/A')}\n"
                message += f"🚿 Phòng tắm: {prop.get('bathrooms', 'N/A')}\n"
                
                if prop.get('description'):
                    desc = prop.get('description')
                    if len(desc) > 150:
                        desc = desc[:150] + "..."
                    message += f"📝 Mô tả: {desc}\n"
                
                message += f"{'='*50}"
                dispatcher.utter_message(text=message)
            
            dispatcher.utter_message(
                text=f"\n💬 Bạn có muốn tìm kiếm thêm bất động sản khác không?"
            )
            
        except Exception as e:
            print(f"DEBUG - Error: {str(e)}")
            dispatcher.utter_message(
                text=f"❌ Đã xảy ra lỗi khi tìm kiếm: {str(e)}"
            )
            return [SlotSet("province", None), SlotSet("district", None), SlotSet("ward", None)]

        # Reset slots sau khi tìm kiếm xong
        return [
            SlotSet("province", None),
            SlotSet("district", None),
            SlotSet("ward", None)
        ]