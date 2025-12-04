from typing import Any, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.events import SlotSet
from rasa_sdk.executor import CollectingDispatcher
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os

class ActionSearchProperties(Action):
    """Search for properties based on collected criteria"""

    def name(self) -> str:
        return "action_search_properties"
    
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
        domain: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        
        # Lấy giá trị các slots
        transaction_type = tracker.get_slot("transaction_type")
        province = tracker.get_slot("province")
        district = tracker.get_slot("district")
        ward = tracker.get_slot("ward")
        property_type = tracker.get_slot("property_type")
        min_area = tracker.get_slot("min_area")
        max_area = tracker.get_slot("max_area")
        bedrooms = tracker.get_slot("bedrooms")
        bathrooms = tracker.get_slot("bathrooms")
        amenities = tracker.get_slot("amenities")
        year_built_min = tracker.get_slot("year_built_min")
        year_built_max = tracker.get_slot("year_built_max")
        min_price = tracker.get_slot("min_price")
        max_price = tracker.get_slot("max_price")
        
        print(f"DEBUG - Collected Slots: transaction_type={transaction_type}, province={province}, district={district}, ward={ward}, property_type={property_type}, min_area={min_area}, max_area={max_area}, bedrooms={bedrooms}, bathrooms={bathrooms}, amenities={amenities}, year_built_min={year_built_min}, year_built_max={year_built_max}, min_price={min_price}, max_price={max_price}")
        
        # Chuẩn hóa transaction_type
        if transaction_type:
            transaction_type_lower = transaction_type.lower()
            if "mua" in transaction_type_lower or "buy" in transaction_type_lower:
                transaction_type = "mua"
            elif "thuê" in transaction_type_lower or "thue" in transaction_type_lower or "rent" in transaction_type_lower:
                transaction_type = "thuê"
        
        # Kiểm tra các trường bắt buộc
        if not transaction_type or not province:
            dispatcher.utter_message(
                text="❌ Xin lỗi, tôi cần biết bạn muốn mua/thuê và ở tỉnh/thành phố nào."
            )
            return []
        
        # Tạo thông báo tìm kiếm
        search_parts = [f"🔍 Đang tìm kiếm bất động sản để **{transaction_type}**"]
        search_parts.append(f"📍 Tại: **{province}**")
        
        if district and district != "other" and district.lower() != "skip":
            search_parts.append(f"   ↳ Quận/Huyện: **{district}**")
        if ward and ward != "other" and ward.lower() != "skip":
            search_parts.append(f"   ↳ Phường/Xã: **{ward}**")
        if property_type:
            search_parts.append(f"🏠 Loại bất động sản: **{property_type}**")
        if min_area:
            search_parts.append(f"📐 Diện tích từ: **{min_area} m²**")
        if max_area:
            search_parts.append(f"📐 Diện tích đến: **{max_area} m²**")
        if bedrooms:
            search_parts.append(f"🛏️ Số phòng ngủ: **{bedrooms}**")
        if bathrooms:
            search_parts.append(f"🚿 Số phòng tắm: **{bathrooms}**")
        # if amenities:
        #     amenities_str = ", ".join(amenities)
        #     search_parts.append(f"✨ Tiện ích: **{amenities_str}**")
        if year_built_min:
            search_parts.append(f"🏗️ Năm xây dựng từ: **{year_built_min}**")
        if year_built_max:
            search_parts.append(f"🏗️ Năm xây dựng đến: **{year_built_max}**")
        if min_price:
            search_parts.append(f"💰 Giá từ: **{min_price} VND**")
        if max_price:
            search_parts.append(f"💰 Giá đến: **{max_price} VND**")
        
        # search_message = "\n".join(search_parts)
        # dispatcher.utter_message(
        #     text=search_message,
        #     metadata={"rephrase": True}
        # )
        
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
        if district and district != "other" and district.lower() != "skip":
            query["address.district"] = {"$regex": district, "$options": "i"}
        
        # Ward là optional
        if ward and ward != "other" and ward.lower() != "skip":
            query["address.ward"] = {"$regex": ward, "$options": "i"}
            
        if transaction_type:
            query["purpose"] = transaction_type
            
        if property_type and property_type != "any" :
            query["property_type"] = property_type
            
        if min_area:
            query["area"] = query.get("area", {})
            query["area"]["$gte"] = min_area
            
        if max_area:
            query["area"] = query.get("area", {})
            query["area"]["$lte"] = max_area
            
        if bedrooms:
            query["bedrooms"] = bedrooms
            
        if bathrooms:
            query["bathrooms"] = bathrooms
            
        if amenities:
            query["amenities"] = {"$all": amenities}
            
        if year_built_min:
            query["year_built"] = query.get("year_built", {})
            query["year_built"]["$gte"] = year_built_min
            
        if year_built_max:
            query["year_built"] = query.get("year_built", {})
            query["year_built"]["$lte"] = year_built_max
            
        if min_price:
            query["price"] = query.get("price", {})
            query["price"]["$gte"] = min_price
            
        if max_price:
            query["price"] = query.get("price", {})
            query["price"]["$lte"] = max_price

        # Tạo thông báo tìm kiếm
        location_parts = [province]
        if district:
            location_parts.append(district)
        if ward:
            location_parts.append(ward)
        
        location_text = ", ".join(location_parts)

        # Truy vấn MongoDB
        try:
            print(f"DEBUG - MongoDB Query: {query}")
            results = list(self.collection.find(query).limit(10))
            print(f"DEBUG - Found {len(results)} results")
            # print(f"DEBUG - Results: {results}")
            
            if not results:
                dispatcher.utter_message(
                    text=f"😞 Rất tiếc, không tìm thấy bất động sản nào giống với yêu cầu của bạn. Để tìm kiếm nâng cao bạn hãy truy cập [EstageGo Search](http://localhost:5173/listing/grid)\n\n"
                         f"💡 Gợi ý:\n"
                         f"• Thử tìm kiếm ở khu vực rộng hơn (bỏ qua quận/huyện hoặc phường/xã)\n"
                         f"• Kiểm tra lại tên địa điểm có chính xác không\n"
                         f"• Thử tìm ở tỉnh/thành phố khác\n\n"
                         f"Bạn có muốn tìm kiếm lại không?"
                )
                return []
            
            # Hiển thị kết quả
            dispatcher.utter_message(
                text=f"✨ Tìm thấy {len(results)} bất động sản phù hợp:"
            )
            
            elements = []
            
            for idx, prop in enumerate(results, 1):
                title = prop.get('title', f"Bất động sản #{idx}")
                image_url = prop.get('media', [])[0].get('url')
                link = f"http://localhost:5173/properties/{prop.get('_id')}"
                
                elements.append({
                    "image_url": image_url,
                    "text": title,
                    "link": link
                })


            dispatcher.utter_message(json_message={
                "type": "carousel",
                "elements": elements
            })
            
        except Exception as e:
            print(f"DEBUG - Error: {str(e)}")
            dispatcher.utter_message(
                text=f"❌ Đã xảy ra lỗi khi tìm kiếm: {str(e)}"
            )
            return []

        # Reset slots sau khi tìm kiếm xong
        return []