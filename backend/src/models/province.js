import mongoose from "mongoose";

// Province Schema (Tỉnh/Thành phố)
const provinceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: Number,
    required: true,
    unique: true
  },
  division_type: {
    type: String,
    required: true
  },
  codename: {
    type: String,
    required: true
  },
  phone_code: {
    type: Number,
    required: true
  },
  districts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District'
  }]
}, {
  timestamps: true
});

provinceSchema.index({ codename: 1 });

export const Province = mongoose.model('Province', provinceSchema);