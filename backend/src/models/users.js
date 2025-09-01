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
        required: true,
        match: [EMAIL_RULE, EMAIL_RULE_MESSAGE],
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
        validate: {
            validator: function (v) {
                return PHONE_RULE.test(v);
            },
            unique: true,
            sparse: true
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
        type: String
    }
}, { timestamps: true }); // Tự động tạo createdAt và updatedAt fields

// Tạo index cho các trường cần thiết
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userName: 1 }, { unique: true });
userSchema.index({ _destroy: 1 });

// Middleware để loại bỏ các field không được phép update
userSchema.pre('findOneAndUpdate', function() {
  const INVALID_UPDATE_VALUES = ['_id', 'username', 'createdAt', 'email']
  const update = this.getUpdate()
  
  if (update.$set) {
    INVALID_UPDATE_VALUES.forEach(field => {
      delete update.$set[field]
    })
  }
  
  // Update updatedAt field
  if (!update.$set) update.$set = {}
  update.$set.updatedAt = new Date()
})

const userModel = mongoose.model('User', userSchema);
export default userModel;