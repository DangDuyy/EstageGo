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
    postType: {
        type: String,
        enum: ['normal', 'vip'],
        default: 'normal'
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
        livingrooms: {
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
            type: String
        },
        country: {
            type: String
        },
        province: {
            type: String,
            required: true
        },
        district: {
            type: String,
            // Cho phép bỏ trống nếu người dùng chọn tọa độ trước
            required: false
        },
        ward: {
            type: String,
            // Cho phép bỏ trống nếu người dùng chọn tọa độ trước
            required: false
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
        },
        tags: [{
            label: {
                type: String,
                required: true
            },
            confidence: {
                type: Number,
                min: 0,
                max: 1,
                default: 1
            },
            source: {
                type: String,
                enum: ['ai', 'manual'],
                default: 'manual'
            },
            position: {
                x: Number,
                y: Number
            }
        }],
        detectedObjects: [{
            name: String,
            bbox: {
                x: Number,
                y: Number,
                width: Number,
                height: Number
            },
            confidence: Number
        }],
        analyzed: {
            type: Boolean,
            default: false
        },
        analyzedAt: Date
    }],
    tour_link: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ListingTierConfig',
        required: false
    },
    priority: {
        type: Number,
        // required: true
    },
    // Tính năng nổi bật (chỉ Advanced)
    isFeatured: {
        type: Boolean,
        default: false,
        index: true
    },
    listingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    expireAt: {
        type: Date,
        default: null
    },
    // Boost/Bump features
    bumpedAt: {
        type: Date,
        default: null,
        index: true
    },
    boostExpiresAt: {
        type: Date,
        default: null,
        index: true
    },
    bumpCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastBumpedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    autoBoost: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'every2days', 'every3days', 'weekly'],
            default: 'daily'
        },
        lastAutoBoostAt: {
            type: Date,
            default: null
        }
    },
    featuredType: {
        type: String,
        enum: ['standard', 'premium', 'gallery'],
        default: 'standard'
    },
    // Optional expiry for featured/vip post type
    postTypeExpiresAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

propertySchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL if you want auto-remove; else keep and set private via a job
propertySchema.index({ bumpedAt: -1 }); // Index for boost sorting
propertySchema.index({ boostExpiresAt: -1 });
propertySchema.index({ postType: -1, bumpedAt: -1, createdAt: -1 }); // Compound index for featured sorting

const propertyModel = mongoose.model('Property', propertySchema)

export default propertyModel