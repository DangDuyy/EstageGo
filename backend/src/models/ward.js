import mongoose from "mongoose";

// Ward Schema (Phường/Xã)
const wardSchema = new mongoose.Schema({
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
  district_code: {
    type: Number,
    required: true,
    ref: 'District'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
wardSchema.index({ district_code: 1 });
wardSchema.index({ codename: 1 });

export const Ward = mongoose.model('Ward', wardSchema);