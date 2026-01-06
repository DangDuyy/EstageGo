import mongoose from "mongoose";
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PHONE_RULE, PHONE_RULE_MESSAGE } from "~/utils/validators";

// === ENUMS (định nghĩa các giá trị cố định) ===
// Vai trò người dùng trong hệ thống
const USER_ROLE = {
    USER: 'user',   // Người dùng thông thường
    AGENT: 'agent', // Môi giới bất động sản
    ADMIN: 'admin'  // Quản trị viên
}

// Giới tính
const USER_GENDER = {
    MALE: 'male',     // Nam
    FEMALE: 'female', // Nữ
    OTHER: 'other'    // Khác
}

// Các dịch vụ hỗ trợ mà agent có thể cung cấp
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
    // === Thông tin đăng nhập ===
    email: {
        type: String,
        match: [EMAIL_RULE, EMAIL_RULE_MESSAGE],
        sparse: true, // Cho phép nhiều null values với unique index
        unique: true
    },
    password: {
        type: String, // Hash password, không lưu plain text
    },
    userName: {
        type: String,
        required: true, // Bắt buộc
        trim: true, // Xóa khoảng trắng đầu/cuối
        minlength: 3,
        maxlength: 50,
        unique: true // Username duy nhất trong hệ thống
    },
    
    // === Thông tin cá nhân ===
    fullName: {
        type: String,
        trim: true,
        maxlength: 120,
        default: null
    },
    avatar: {
        type: String, // URL của ảnh đại diện
        default: null
    },
    phone: {
        type: String,
        sparse: true, // Cho phép nhiều null values với unique index
        unique: true, // Số điện thoại duy nhất
        validate: {
            validator: function (v) {
                if (!v) return true // Cho phép null
                return PHONE_RULE.test(v)
            },
            message: PHONE_RULE_MESSAGE
        }
    },
    gender: {
        type: String,
        enum: Object.values(USER_GENDER), // male, female, other
        default: null
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLE), // user, agent, admin
        default: USER_ROLE.USER
    },
    address: {
        type: String, // Địa chỉ đầy đủ
        default: null
    },
    dob: {
        type: Date, // Date of birth (ngày sinh)
        default: null
    },
    
    // === Trạng thái tài khoản ===
    isActive: {
        type: Boolean, // Tài khoản có đang hoạt động không
        default: false
    },
    verifyToken: {
        type: String, // Token để xác thực email
        default: null
    },
    verifyTokenExpires: {
        type: Date, // Thời gian hết hạn của verify token
        default: null
    },
    isEmailVerified: {
        type: Boolean, // Email đã được xác thực chưa
        default: false
    },
    isPhoneVerified: {
        type: Boolean, // Số điện thoại đã được xác thực chưa
        default: false
    },
    
    // === Thông tin dành cho Agent (môi giới) ===
    companyName: {
        type: String, // Tên công ty môi giới
        default: null,
        trim: true,
        maxlength: 200
    },
    bio: {
        type: String, // Giới thiệu bản thân
        default: null,
        maxlength: 2000
    },
    experience: {
        type: Number, // Số năm kinh nghiệm
        default: null,
        min: 0
    },
    
    // === Trang môi giới (chỉ có khi có gói Boosted/Advanced) ===
    brokerPage: {
        agentTitle: {
            type: String, // Chức danh/tiêu đề agent
            default: null,
            trim: true,
            maxlength: 200
        },
        expireAt: {
            type: Date, // Ngày hết hạn trang môi giới
            default: () => new Date(Date.now() - 24 * 60 * 60 * 1000) // Mặc định đã hết hạn
        },
        slug: { 
            type: String, // URL slug duy nhất cho trang môi giới
            unique: true, 
            sparse: true 
        },
        bio: String, // Giới thiệu chi tiết
        coverImage: String, // Ảnh bìa trang môi giới
        yearsOfExperience: Number, // Số năm kinh nghiệm
        supportServices: [{
            type: String, // Các dịch vụ hỗ trợ (tư vấn, vay vốn, công chứng...)
            enum: Object.values(SUPPORT_SERVICES),
        }],
        operatingAreas: [String] // Các khu vực hoạt động
    },
    licenseNumber: {
        type: String, // Số giấy phép hành nghề môi giới
        default: null,
        trim: true
    },
    website: {
        type: String, // Website cá nhân
        default: null
    },
    socialLinks: {
        facebook: { type: String, default: null },
        linkedin: { type: String, default: null },
        twitter: { type: String, default: null }
    },
    agentRequestStatus: {
        type: String, // Trạng thái đăng ký làm agent
        enum: ['none', 'pending', 'approved', 'rejected'], // none: chưa đăng ký, pending: đang chờ, approved: đã duyệt, rejected: bị từ chối
        default: 'none'
    },
    
    // === Tài chính ===
    balance: {
        type: Number, // Số dư tài khoản (VND)
        default: 0,
        min: 0
    },
    boostCredits: {
        type: Number, // Số boost credits còn lại (1 credit = 24h boost)
        default: 0,
        min: 0
    },
    
    // === Trạng thái hoạt động (Presence) ===
    isOnline: {
        type: Boolean, // Đang online hay không
        default: false
    },
    lastActiveAt: {
        type: Date, // Thời gian hoạt động cuối cùng
        default: null
    },
    
    // === Reset password ===
    resetPasswordToken: {
        type: String, // Token để reset mật khẩu
        default: null
    },
    resetPasswordExpires: {
        type: Date, // Thời gian hết hạn của reset password token
        default: null
    }
}, { 
    timestamps: true // Tự động tạo createdAt và updatedAt
})

/**
 * Validation: User phải có ít nhất email HOẶC phone
 * Chạy trước khi save document mới
 */
userSchema.pre('save', function (next) {
    if (!this.email && !this.phone) {
        next(new Error('User must have either email or phone number'))
    } else {
        next()
    }
})

// Tạo index cho username để tăng tốc độ tìm kiếm
userSchema.index({ userName: 1 }, { unique: true })

// Middleware để ngăn cập nhật các field không được phép thay đổi
// Chạy trước mỗi lần findOneAndUpdate
userSchema.pre('findOneAndUpdate', function () {
    // Các field không được phép cập nhật sau khi tạo
    const INVALID_UPDATE_VALUES = [
        '_id',        // ID MongoDB không được thay đổi
        'userName',   // Username không được thay đổi sau khi tạo
        'createdAt',  // Thời gian tạo không được thay đổi
        'email'       // Email không được thay đổi trực tiếp (cần verify lại)
    ]
    const update = this.getUpdate()

    // Xóa các field không hợp lệ khỏi $set
    if (update.$set) {
        INVALID_UPDATE_VALUES.forEach(field => {
            delete update.$set[field]
        })
    }

    // Tự động cập nhật updatedAt
    if (!update.$set) update.$set = {}
    update.$set.updatedAt = new Date()
})

const userModel = mongoose.model('User', userSchema)
export default userModel