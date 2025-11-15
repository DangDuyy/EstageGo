import { SchemaType } from "@google/generative-ai";

/**
 * JSON Schema để Gemini trả về structured output cho MongoDB query filter
 * Dựa trên model properties.js
 */
export const propertyFilterSchema = {
    type: SchemaType.OBJECT,
    description: "Cấu trúc JSON filter cho Mongoose query (Property.find({filters})). Chỉ sử dụng các toán tử MongoDB như $gte, $lte, $regex, $in, $eq.",
    properties: {
        // Số phòng ngủ
        "rooms.bedrooms": {
            type: SchemaType.OBJECT,
            description: "Số phòng ngủ tối thiểu/tối đa. Dùng $gte (>=), $lte (<=), hoặc $eq (=).",
            properties: {
                "$gte": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng ngủ tối thiểu." 
                },
                "$lte": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng ngủ tối đa." 
                },
                "$eq": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng ngủ chính xác." 
                }
            },
            nullable: true
        },
        
        // Số phòng tắm
        "rooms.bathrooms": {
            type: SchemaType.OBJECT,
            description: "Số phòng tắm tối thiểu/tối đa. Dùng $gte, $lte, hoặc $eq.",
            properties: {
                "$gte": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng tắm tối thiểu." 
                },
                "$lte": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng tắm tối đa." 
                },
                "$eq": { 
                    type: SchemaType.NUMBER, 
                    description: "Số phòng tắm chính xác." 
                }
            },
            nullable: true
        },

        // Giá trị
        "price.value": {
            type: SchemaType.OBJECT,
            description: "Giá trị tiền tệ tối thiểu/tối đa (VND). Dùng $gte (min) hoặc $lte (max). Phải chuyển đổi 'tỷ'/'billion' sang x*1000000000, 'triệu'/'million' sang x*1000000.",
            properties: {
                "$gte": { 
                    type: SchemaType.NUMBER, 
                    description: "Giá trị tối thiểu (VND)." 
                },
                "$lte": { 
                    type: SchemaType.NUMBER, 
                    description: "Giá trị tối đa (VND)." 
                }
            },
            nullable: true
        },

        // Diện tích
        "area": {
            type: SchemaType.OBJECT,
            description: "Diện tích tối thiểu/tối đa (m²). Dùng $gte hoặc $lte.",
            properties: {
                "$gte": { 
                    type: SchemaType.NUMBER, 
                    description: "Diện tích tối thiểu (m²)." 
                },
                "$lte": { 
                    type: SchemaType.NUMBER, 
                    description: "Diện tích tối đa (m²)." 
                }
            },
            nullable: true
        },

        // Mục đích (sale/rent)
        "purpose": {
            type: SchemaType.STRING,
            description: "Mục đích sử dụng. Chỉ chấp nhận 'sale' (bán) hoặc 'rent' (cho thuê). Ví dụ: 'for sale', 'to buy', 'mua' -> 'sale'. 'for rent', 'cho thuê' -> 'rent'.",
            enum: ["sale", "rent"],
            nullable: true
        },

        // Loại bất động sản
        "type": {
            type: SchemaType.STRING,
            description: "Loại bất động sản. Các giá trị hợp lệ: 'apartment' (căn hộ, chung cư), 'house' (nhà phố, nhà riêng), 'condo' (condotel), 'land' (đất, mảnh đất), 'commercial' (thương mại), 'office' (văn phòng), 'villa' (biệt thự), 'townhouse' (nhà liền kề), 'other' (khác).",
            enum: ["apartment", "house", "condo", "land", "commercial", "office", "villa", "townhouse", "other"],
            nullable: true
        },

        // Tìm kiếm theo địa chỉ/vị trí
        "address.fullAddress": {
            type: SchemaType.OBJECT,
            description: "Tìm kiếm vị trí/mô tả bằng từ khóa. Dùng $regex để tìm kiếm không chính xác với $options: 'i' (không phân biệt chữ hoa/thường).",
            properties: {
                "$regex": { 
                    type: SchemaType.STRING, 
                    description: "Mẫu regex để tìm kiếm địa chỉ (ví dụ: 'quận 1', 'gần trường học', 'near school')." 
                },
                "$options": { 
                    type: SchemaType.STRING, 
                    description: "Luôn đặt là 'i' để tìm kiếm không phân biệt chữ hoa/thường." 
                }
            },
            nullable: true
        },

        // Tỉnh/Thành phố
        "address.province": {
            type: SchemaType.OBJECT,
            description: "Tìm kiếm theo tỉnh/thành phố bằng regex.",
            properties: {
                "$regex": { 
                    type: SchemaType.STRING, 
                    description: "Tên tỉnh/thành phố (ví dụ: 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng')." 
                },
                "$options": { 
                    type: SchemaType.STRING, 
                    description: "Luôn đặt là 'i'." 
                }
            },
            nullable: true
        },

        // Quận/Huyện
        "address.district": {
            type: SchemaType.OBJECT,
            description: "Tìm kiếm theo quận/huyện bằng regex.",
            properties: {
                "$regex": { 
                    type: SchemaType.STRING, 
                    description: "Tên quận/huyện." 
                },
                "$options": { 
                    type: SchemaType.STRING, 
                    description: "Luôn đặt là 'i'." 
                }
            },
            nullable: true
        },

        // Tiện ích (amenities)
        "amenities": {
            type: SchemaType.OBJECT,
            description: "Tìm kiếm các tiện ích. Dùng $in để tìm bất kỳ tiện ích nào trong danh sách, hoặc $all để yêu cầu tất cả.",
            properties: {
                "$in": {
                    type: SchemaType.ARRAY,
                    description: "Danh sách các tiện ích (swimming pool, gym, parking, garden, security, elevator, etc.).",
                    items: {
                        type: SchemaType.STRING
                    }
                },
                "$all": {
                    type: SchemaType.ARRAY,
                    description: "Yêu cầu tất cả các tiện ích này phải có.",
                    items: {
                        type: SchemaType.STRING
                    }
                }
            },
            nullable: true
        },

        // Status (active, sold, rented, etc.)
        "status": {
            type: SchemaType.STRING,
            description: "Trạng thái của bất động sản. Mặc định là 'active' (đang hoạt động). Các giá trị khác: 'sold' (đã bán), 'rented' (đã cho thuê), 'hidden', 'draft'.",
            enum: ["active", "hidden", "sold", "rented", "draft"],
            nullable: true
        }
    }
};
