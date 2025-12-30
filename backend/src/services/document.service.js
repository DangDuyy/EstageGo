import { Document } from "~/models/documents";
import qdrantService from "~/services/qdrant.service.js";

class DocumentService {
    /**
     * Tạo document mới (lưu MongoDB + index Qdrant)
     */
    async createDocument(data) {
        try {
            const { plaintext, html, tiptap_json, metadata } = data;

            // 1. Validate
            if (!plaintext || !html || !tiptap_json) {
                throw new Error("Missing required content fields");
            }

            // 2. Tạo MongoDB document
            const doc = new Document({
                content: { plaintext, html, tiptap_json },
                metadata: {
                    title: metadata.title || "Untitled",
                    category: metadata.category,
                    tags: metadata.tags || [],
                    language: metadata.language || "vi",
                    author: metadata.author,
                    source: metadata.source,
                    active: metadata.active ?? true,
                    custom: metadata.custom || {},
                },
                status: metadata.status || "published",
                published_at: metadata.status === "published" ? new Date() : null,
            });

            await doc.save();

            // 3. Index vào Qdrant (chỉ với plaintext)
            const vectorResult = await qdrantService.indexDocument(
                plaintext,
                {
                    mongo_id: doc._id.toString(),
                    title: doc.metadata.title,
                    category: doc.metadata.category,
                    active: doc.metadata.active,
                }
            );

            // 4. Update vector reference
            doc.vector_refs = {
                qdrant_doc_id: vectorResult.qdrant_doc_id,
                chunk_count: vectorResult.chunk_count,
                last_indexed: new Date(),
            };

            await doc.save();

            return {
                success: true,
                document: this._formatDocument(doc),
            };
        } catch (error) {
            console.error("Create document error:", error);
            throw error;
        }
    }

    /**
     * Cập nhật document
     */
    async updateDocument(mongoId, data) {
        try {
            const doc = await Document.findById(mongoId);
            if (!doc) {
                throw new Error("Document not found");
            }

            const { plaintext, html, tiptap_json, metadata } = data;

            // Update content
            if (plaintext) doc.content.plaintext = plaintext;
            if (html) doc.content.html = html;
            if (tiptap_json) doc.content.tiptap_json = tiptap_json;

            // Update metadata
            if (metadata) {
                Object.keys(metadata).forEach((key) => {
                    if (metadata[key] !== undefined) {
                        doc.metadata[key] = metadata[key];
                    }
                });
            }

            // Increment version
            doc.version += 1;

            await doc.save();

            // Re-index nếu có thay đổi content
            if (plaintext) {
                const vectorResult = await qdrantService.reindexDocument(
                    doc.vector_refs.qdrant_doc_id,
                    doc.content.plaintext,
                    {
                        mongo_id: doc._id.toString(),
                        title: doc.metadata.title,
                        category: doc.metadata.category,
                        active: doc.metadata.active,
                    }
                );

                doc.vector_refs.chunk_count = vectorResult.chunk_count;
                doc.vector_refs.last_indexed = new Date();
                await doc.save();
            }

            return {
                success: true,
                document: this._formatDocument(doc),
            };
        } catch (error) {
            console.error("Update document error:", error);
            throw error;
        }
    }

    /**
     * Xóa document (soft delete hoặc hard delete)
     */
    async deleteDocument(mongoId, hardDelete = false) {
        try {
            const doc = await Document.findById(mongoId);
            if (!doc) {
                throw new Error("Document not found");
            }

            if (hardDelete) {
                // Hard delete: xóa khỏi cả MongoDB và Qdrant
                await qdrantService.deleteDocument(doc.vector_refs.qdrant_doc_id);
                await doc.deleteOne();
            } else {
                // Soft delete: chỉ archive
                doc.status = "archived";
                doc.metadata.active = false;
                await doc.save();

                // Deactivate trong Qdrant
                await qdrantService.updateMetadata(doc.vector_refs.qdrant_doc_id, {
                    active: false,
                });
            }

            return { success: true, hard_deleted: hardDelete };
        } catch (error) {
            console.error("Delete document error:", error);
            throw error;
        }
    }

    /**
     * Lấy document theo ID
     */
    async getDocument(mongoId) {
        try {
            const doc = await Document.findById(mongoId);
            if (!doc) {
                throw new Error("Document not found");
            }

            return {
                success: true,
                document: this._formatDocument(doc),
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * List documents với filter và pagination
     */
    async listDocuments(filters = {}, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = { created_at: -1 },
            } = options;

            const query = {};

            if (filters.title) query["metadata.title"] = { $regex: filters.title, $options: "i" };
            if (filters.category) query["metadata.category"] = filters.category;
            if (filters.status) query.status = filters.status;
            if (filters.active !== undefined) query["metadata.active"] = filters.active;
            if (filters.tags?.length > 0) query["metadata.tags"] = { $in: filters.tags };

            const total = await Document.countDocuments(query);
            const documents = await Document.find(query)
                .sort(sort)
                .skip((page - 1) * limit)
                .limit(limit);

            return {
                success: true,
                documents: documents.map((doc) => this._formatDocument(doc)),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Semantic search (query Qdrant rồi enrich từ MongoDB)
     */
    async searchDocuments(query, filters = {}, limit = 5) {
        try {
            // 1. Search trong Qdrant
            const qdrantResults = await qdrantService.search(query, filters, limit);

            if (qdrantResults.length === 0) {
                return {
                    success: true,
                    query,
                    results: [],
                };
            }

            // 2. Lấy full document từ MongoDB
            const mongoIds = [...new Set(
                qdrantResults.map((r) => r.metadata.mongo_id)
            )];

            const documents = await Document.find({
                _id: { $in: mongoIds },
            });

            const docMap = new Map(
                documents.map((doc) => [doc._id.toString(), doc])
            );

            // 3. Combine results
            const enrichedResults = qdrantResults.map((result) => {
                const doc = docMap.get(result.metadata.mongo_id);
                return {
                    score: result.score,
                    chunk_content: result.content,
                    document: doc ? this._formatDocument(doc) : null,
                };
            });

            return {
                success: true,
                query,
                results: enrichedResults,
            };
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Rebuild Qdrant index từ MongoDB
     */
    async rebuildIndex(mongoId = null) {
        try {
            const query = mongoId ? { _id: mongoId } : { status: "published" };
            const documents = await Document.find(query);

            let indexed = 0;
            let failed = 0;

            for (const doc of documents) {
                try {
                    // Xóa index cũ nếu có
                    if (doc.vector_refs.qdrant_doc_id) {
                        await qdrantService.deleteDocument(doc.vector_refs.qdrant_doc_id);
                    }

                    // Index lại
                    const vectorResult = await qdrantService.indexDocument(
                        doc.content.plaintext,
                        {
                            mongo_id: doc._id.toString(),
                            title: doc.metadata.title,
                            category: doc.metadata.category,
                            active: doc.metadata.active,
                        }
                    );

                    doc.vector_refs = {
                        qdrant_doc_id: vectorResult.qdrant_doc_id,
                        chunk_count: vectorResult.chunk_count,
                        last_indexed: new Date(),
                    };

                    await doc.save();
                    indexed++;
                } catch (error) {
                    console.error(`Failed to index document ${doc._id}:`, error);
                    failed++;
                }
            }

            return {
                success: true,
                indexed,
                failed,
                total: documents.length,
            };
        } catch (error) {
            throw new Error(`Rebuild index failed: ${error.message}`);
        }
    }

    /**
     * Format document cho response
     */
    _formatDocument(doc) {
        return {
            id: doc._id,
            content: doc.content,
            metadata: doc.metadata,
            vector_refs: doc.vector_refs,
            version: doc.version,
            status: doc.status,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            published_at: doc.published_at,
        };
    }
}

export default new DocumentService();