import { meta } from "@babel/eslint-parser"
import mongoose from "mongoose"

const propertySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'hidden', 'sold', 'rented', 'draft'],
        default: 'active'
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    purpose: {
        type: String,
        enum: ['sale', 'rent'],
        required: true
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'condo', 'land', 'commercial', 'office', 'villa', 'townhouse', 'other'],
        required: true
    },
    yearBuilt: {
        type: Number,
        max: new Date().getFullYear()
    },
    area: {
        type: Number,
        required: true,
        min: 0 // Diện tích không thể âm
    },
    rooms: {
        bedrooms: {
            type: Number,
            min: 0,
            default: 0
        },
        bathrooms: {
            type: Number,
            min: 0,
            default: 0
        },
        livingRooms: {
            type: Number,
            min: 0,
            default: 0
        },
        kitchens: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    amenities: [{ // Danh sách tiện ích
        type: String
    }],
    address: {
        fullAddress: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        province: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        ward: {
            type: String,
            required: true
        },
        street: {
            type: String,
            required: true
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                index: '2dsphere' // Giúp tối ưu hóa truy vấn không gian
            }
        }
    },
    price: {
        value: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            required: true,
            enum: ['VND', 'USD', 'EUR'], // Các đơn vị tiền tệ hợp lệ
            default: 'VND'
        },
        period: { // Nếu là cho thuê
            type: String,
            enum: ['month', 'year', 'other'],
            default: 'month'
        }
    },
    media: [{
        url: {
            type: String,
            required: true
        },
        type: { // file để lưu các giấy tờ như bản sao sổ đỏ, hợp đồng, ...
            type: String,
            // enum: ['image', 'video', 'file'],
            required: true
        },
        metadata: { // Thông tin thêm về file
            filename: String,
            size: Number, // Kích thước file tính theo bytes
            uploadedAt: { type: Date, default: Date.now },
            mimetype: String // loại MIME (image/png, application/pdf, ...).
        }
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

const propertyModel = mongoose.model('Property', propertySchema)

export default propertyModel