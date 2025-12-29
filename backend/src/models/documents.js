import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  // Content trong các format
  content: {
    plaintext: { type: String, required: true },
    html: { type: String, required: true },
    tiptap_json: { type: Object, required: true }, // TipTap document structure
  },

  // Metadata
  metadata: {
    title: { type: String, required: true },
    category: { type: String, index: true },
    tags: [{ type: String, index: true }],
    language: { type: String, default: "vi" },
    author: { type: String },
    source: { type: String }, // source URL hoặc origin
    active: { type: Boolean, default: true, index: true },
    // Custom fields
    custom: { type: Map, of: mongoose.Schema.Types.Mixed },
  },

  // Vector DB reference
  vector_refs: {
    qdrant_doc_id: { type: String, index: true }, // UUID trong Qdrant
    chunk_count: { type: Number, default: 0 },
    last_indexed: { type: Date },
  },

  // Versioning & audit
  version: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "published",
    index: true,
  },

  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  published_at: { type: Date },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

// Indexes for common queries
documentSchema.index({ "metadata.category": 1, "metadata.active": 1 });
documentSchema.index({ "metadata.tags": 1, status: 1 });
documentSchema.index({ created_at: -1 });

export const Document = mongoose.model("Document", documentSchema);