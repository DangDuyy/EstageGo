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

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        match: [EMAIL_RULE, EMAIL_RULE_MESSAGE],
        sparse: true,
        unique: true
    },
    password: {
        type: String,
        required: true
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
    agentTitle: {
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
    specializations: [{
        type: String,
        trim: true
    }],
    areasServed: [{
        type: String,
        trim: true
    }],
    experience: {
        type: Number,
        default: null,
        min: 0
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
    }
}, { timestamps: true })

// Validate: phải có ít nhất email HOẶC phone
userSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    next(new Error('User must have either email or phone number'))
  } else {
    next()
  }
})

// Tạo index
userSchema.index({ userName: 1 }, { unique: true })

// Middleware để loại bỏ các field không được phép update
userSchema.pre('findOneAndUpdate', function() {
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