import mongoose from "mongoose";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "~/utils/validators";

const USER_ROLE = {
    USER: 'user',
    AGENT: 'agent',
    ADMIN: 'admin'
}
const USER_GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
}
const SUPPORT_SERVICES = {
    FINANCIAL_CONSULTING: 'Tư vấn tài chính',
    LOAN_SUPPORT: 'Hỗ trợ vay vốn',
    LAND_DIVISION: 'Hỗ trợ phân lô, tách thửa',
    NOTARY_SUPPORT: 'Hỗ trợ công chứng ba bên',
    DOCUMENTATION_SUPPORT: 'Hỗ trợ hoàn thiện hồ sơ đăng bộ',
    DOCUMENT_PREPARATION: 'Hỗ trợ làm giấy tờ, hồ sơ nhà đất',
    PROPERTY_CONSIGNMENT: 'Nhận kí gửi bất động sản',
    CONSTRUCTION_PERMIT: 'Xin phép xây dựng',
    INTERIOR_FINISHING: 'Hỗ trợ hoàn thiện nội thất',
    PROPERTY_LEGALIZATION: 'Hỗ trợ hợp thức hoá nhà đất'
}

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        match: [EMAIL_RULE, EMAIL_RULE_MESSAGE],
        sparse: true,
        unique: true
    },
    password: {
        type: String,
    },
    userName: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
        unique: true
    },
    fullName: {
        type: String,
        trim: true,
        maxlength: 120,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        sparse: true,
        unique: true,
        validate: {
            validator: function (v) {
                if (!v) return true
                return PHONE_RULE.test(v)
            },
            message: PHONE_RULE_MESSAGE
        }
    },
    gender: {
        type: String,
        enum: Object.values(USER_GENDER),
        default: null
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLE),
        default: USER_ROLE.USER
    },
    address: {
        type: String,
        default: null
    },
    dob: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: false
    },
    verifyToken: {
        type: String,
        default: null
    },
    verifyTokenExpires: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    // Agent-specific fields
    companyName: {
        type: String,
        default: null,
        trim: true,
        maxlength: 200
    },
    bio: {
        type: String,
        default: null,
        maxlength: 2000
    },
    experience: {
        type: Number,
        default: null,
        min: 0
    },
    // Trang môi giới (chỉ có khi có gói Boosted/Advanced)
    brokerPage: {
        agentTitle: {
            type: String,
            default: null,
            trim: true,
            maxlength: 200
        },
        expireAt: {
            type: Date,
            default: () => new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        slug: { type: String, unique: true, sparse: true },
        bio: String,
        coverImage: String,
        yearsOfExperience: Number,
        supportServices: [{
            type: String,
            enum: Object.values(SUPPORT_SERVICES),
        }],
        operatingAreas: [String]
    },
    licenseNumber: {
        type: String,
        default: null,
        trim: true
    },
    website: {
        type: String,
        default: null
    },
    socialLinks: {
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null }
    },
    agentRequestStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    membershipLevel: {
        type: String,
        enum: ['basic', 'standard', 'premium'],
        default: 'basic'
    },
    membershipExpireAt: {
        type: Date,
        default: null
    },
    membershipBillingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: null
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    boostCredits: {
        type: Number,
        default: 0,
        min: 0
    },
    // Presence fields
    isOnline: {
        type: Boolean,
        default: false
    },
    lastActiveAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

// Validate: phải có ít nhất email HOẶC phone
userSchema.pre('save', function (next) {
    if (!this.email && !this.phone) {
        next(new Error('User must have either email or phone number'))
    } else {
        next()
    }
})

// Tạo index
userSchema.index({ userName: 1 }, { unique: true })

// Middleware để loại bỏ các field không được phép update
userSchema.pre('findOneAndUpdate', function () {
    const INVALID_UPDATE_VALUES = ['_id', 'userName', 'createdAt', 'email']
    const update = this.getUpdate()

    if (update.$set) {
        INVALID_UPDATE_VALUES.forEach(field => {
            delete update.$set[field]
        })
    }

    if (!update.$set) update.$set = {}
    update.$set.updatedAt = new Date()
})

const userModel = mongoose.model('User', userSchema)
export default userModel