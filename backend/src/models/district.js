import mongoose from "mongoose";

// District Schema (Quận/Huyện)
const districtSchema = new mongoose.Schema({
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
  province_code: {
    type: Number,
    required: true,
    ref: 'Province'
  },
  wards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward'
  }]
}, {
  timestamps: true
});

districtSchema.index({ province_code: 1 });
districtSchema.index({ codename: 1 });

export const District = mongoose.model('District', districtSchema);