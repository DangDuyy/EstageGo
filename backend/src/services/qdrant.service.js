// import { QdrantVectorStore } from "@langchain/qdrant";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { Document } from "@langchain/core/documents";
// import { qdrantClient, embeddings, COLLECTION_NAME } from "../config/qdrant.config.js";
// import { v4 as uuidv4 } from "uuid";

// class QdrantService {
//     constructor() {
//         this.client = qdrantClient;
//         this.embeddings = embeddings;
//         this.collectionName = COLLECTION_NAME;
//         this.splitter = new RecursiveCharacterTextSplitter({
//             chunkSize: 1000,
//             chunkOverlap: 200,
//         });
//     }

//     async ensurePayloadIndex(
//         collectionName,
//         fieldName
//     ) {
//         const collectionInfo = await this.client.getCollection(collectionName);

//         const payloadIndexes =
//             collectionInfo.payload_schema ?? {};

//         if (payloadIndexes[fieldName]) {
//             console.log(`✅ Index already exists for ${fieldName}`);
//             return;
//         }

//         console.log(`⚙️ Creating index for ${fieldName}...`);

//         await this.client.createPayloadIndex(collectionName, {
//             field_name: fieldName,
//             field_schema: "keyword",
//         });

//         console.log(`🎉 Index created for ${fieldName}`);
//     }

//     /**
//      * Thêm document mới vào Qdrant
//      */
//     async addDocument(pageContent, metadata) {
//         try {
//             // Tạo document
//             const doc = new Document({
//                 pageContent,
//                 metadata: {
//                     ...metadata,
//                     doc_id: uuidv4(), // ID riêng để quản lý document
//                     created_at: new Date().toISOString(),
//                 },
//             });

//             // const indexesToEnsure = [
//             //     "metadata.doc_id",
//             // ];

//             // for (const field of indexesToEnsure) {
//             //     await this.ensurePayloadIndex("rasa_knowledge_base", field);
//             // }


//             // Chia nhỏ nội dung
//             const chunks = await this.splitter.splitDocuments([doc]);

//             const vectors = await this.embeddings.embedDocuments(chunks.map(c => c.pageContent));
//             console.log("Vectors[0] length:", vectors[0]?.length);

//             if (!vectors[0]?.length) {
//                 throw new Error("Embedding returned empty vector. Possible API key invalid or expired.");
//             }


//             // Đẩy lên Qdrant
//             await QdrantVectorStore.fromDocuments(chunks, this.embeddings, {
//                 client: this.client,
//                 collectionName: this.collectionName,
//                 contentPayloadKey: "page_content",
//                 metadataPayloadKey: "metadata",
//             });

//             return {
//                 success: true,
//                 doc_id: doc.metadata.doc_id,
//                 chunks_created: chunks.length,
//                 message: "Document added successfully",
//             };
//         } catch (error) {
//             console.error(error);
//             throw new Error(`Failed to add document: ${error.message}`);
//         }
//     }

//     /**
//      * Cập nhật document (xóa cũ → thêm mới)
//      */
//     async updateDocument(docId, pageContent, metadata) {
//         try {
//             // Xóa document cũ
//             await this.deleteDocument(docId);

//             // Thêm document mới với cùng doc_id
//             const doc = new Document({
//                 pageContent,
//                 metadata: {
//                     ...metadata,
//                     doc_id: docId,
//                     updated_at: new Date().toISOString(),
//                 },
//             });

//             const chunks = await this.splitter.splitDocuments([doc]);

//             await QdrantVectorStore.fromDocuments(chunks, this.embeddings, {
//                 client: this.client,
//                 collectionName: this.collectionName,
//                 contentPayloadKey: "page_content",
//                 metadataPayloadKey: "metadata",
//             });

//             return {
//                 success: true,
//                 doc_id: docId,
//                 chunks_updated: chunks.length,
//                 message: "Document updated successfully",
//             };
//         } catch (error) {
//             throw new Error(`Failed to update document: ${error.message}`);
//         }
//     }

//     /**
//      * Xóa document theo doc_id
//      */
//     async deleteDocument(docId) {
//         try {
//             const result = await this.client.delete(this.collectionName, {
//                 filter: {
//                     must: [
//                         {
//                             key: "metadata.doc_id",
//                             match: { value: docId },
//                         },
//                     ],
//                 },
//             });

//             return {
//                 success: true,
//                 doc_id: docId,
//                 message: "Document deleted successfully",
//                 operation_id: result.operation_id,
//             };
//         } catch (error) {
//             throw new Error(`Failed to delete document: ${error.message}`);
//         }
//     }

//     /**
//      * Tìm kiếm semantic
//      */
//     async searchDocuments(query, filters = {}, limit = 5) {
//         try {
//             // Tạo embedding cho query
//             const queryVector = await this.embeddings.embedQuery(query);

//             // Build filter
//             const mustConditions = [];

//             if (filters.category) {
//                 mustConditions.push({
//                     key: "metadata.category",
//                     match: { value: filters.category },
//                 });
//             }

//             if (filters.active !== undefined) {
//                 mustConditions.push({
//                     key: "metadata.active",
//                     match: { value: filters.active },
//                 });
//             }

//             if (filters.title) {
//                 mustConditions.push({
//                     key: "metadata.title",
//                     match: { value: filters.title },
//                 });
//             }

//             // Search
//             const searchResult = await this.client.search(this.collectionName, {
//                 vector: queryVector,
//                 limit,
//                 filter: mustConditions.length > 0 ? { must: mustConditions } : undefined,
//                 with_payload: true,
//             });

//             return {
//                 success: true,
//                 query,
//                 results: searchResult.map((r) => ({
//                     id: r.id,
//                     score: r.score,
//                     page_content: r.payload.page_content,
//                     metadata: r.payload.metadata,
//                 })),
//             };
//         } catch (error) {
//             throw new Error(`Failed to search documents: ${error.message}`);
//         }
//     }

//     /**
//      * Lấy tất cả documents (scroll/pagination)
//      */
//     async getAllDocuments(filters = {}, limit = 100, offset = null) {
//         try {
//             const mustConditions = [];

//             //   if (filters.category) {
//             //     mustConditions.push({
//             //       key: "metadata.category",
//             //       match: { value: filters.category },
//             //     });
//             //   }

//             //   if (filters.active !== undefined) {
//             //     mustConditions.push({
//             //       key: "metadata.active",
//             //       match: { value: filters.active },
//             //     });
//             //   }

//             const scrollResult = await this.client.scroll(this.collectionName, {
//                 limit,
//                 offset,
//                 filter: mustConditions.length > 0 ? { must: mustConditions } : undefined,
//                 with_payload: true,
//                 with_vector: false,
//             });

//             return {
//                 success: true,
//                 points: scrollResult.points.map((p) => ({
//                     id: p.id,
//                     page_content: p.payload.page_content,
//                     metadata: p.payload.metadata,
//                 })),
//                 next_offset: scrollResult.next_page_offset,
//             };
//         } catch (error) {
//             throw new Error(`Failed to get documents: ${error.message}`);
//         }
//     }

//     /**
//      * Lấy document theo doc_id
//      */
//     async getDocumentById(docId) {
//         try {
//             const scrollResult = await this.client.scroll(this.collectionName, {
//                 filter: {
//                     must: [
//                         {
//                             key: "metadata.doc_id",
//                             match: { value: docId },
//                         },
//                     ],
//                 },
//                 with_payload: true,
//                 with_vector: false,
//             });

//             if (scrollResult.points.length === 0) {
//                 return { success: false, message: "Document not found" };
//             }

//             return {
//                 success: true,
//                 chunks: scrollResult.points.map((p) => ({
//                     id: p.id,
//                     page_content: p.payload.page_content,
//                     metadata: p.payload.metadata,
//                 })),
//             };
//         } catch (error) {
//             console.error(error);
//             throw new Error(`Failed to get document: ${error.message}`);
//         }
//     }

//     /**
//      * Cập nhật metadata của document
//      */
//     async updateMetadata(docId, metadataUpdates) {
//         try {
//             // Lấy tất cả chunks của document
//             const doc = await this.getDocumentById(docId);

//             if (!doc.success) {
//                 throw new Error("Document not found");
//             }

//             // Update metadata cho từng chunk
//             const pointIds = doc.chunks.map((c) => c.id);

//             await this.client.setPayload(this.collectionName, {
//                 points: pointIds,
//                 payload: {
//                     metadata: {
//                         ...doc.chunks[0].metadata,
//                         ...metadataUpdates,
//                         updated_at: new Date().toISOString(),
//                     },
//                 },
//             });

//             return {
//                 success: true,
//                 doc_id: docId,
//                 chunks_updated: pointIds.length,
//                 message: "Metadata updated successfully",
//             };
//         } catch (error) {
//             throw new Error(`Failed to update metadata: ${error.message}`);
//         }
//     }
// }

// export default new QdrantService();

// services/qdrant.service.js
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { qdrantClient, embeddings, COLLECTION_NAME } from "../config/qdrant.config.js";
import { v4 as uuidv4 } from "uuid";

class QdrantService {
  constructor() {
    this.client = qdrantClient;
    this.embeddings = embeddings;
    this.collectionName = COLLECTION_NAME;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  /**
   * Index document to Qdrant (chỉ nhận plaintext)
   * Returns: { qdrant_doc_id, chunk_count }
   */
  async indexDocument(plaintext, metadata, qdrantDocId = null) {
    try {
      const docId = qdrantDocId || uuidv4();

      // Tạo document với metadata tối giản
      const doc = new Document({
        pageContent: plaintext,
        metadata: {
          doc_id: docId,
          mongo_id: metadata.mongo_id, // Reference to MongoDB
          title: metadata.title,
          category: metadata.category,
          active: metadata.active ?? true,
          indexed_at: new Date().toISOString(),
        },
      });

      // Split và embed
      const chunks = await this.splitter.splitDocuments([doc]);

      // Validate embeddings
      const vectors = await this.embeddings.embedDocuments(
        chunks.map((c) => c.pageContent)
      );

      if (!vectors[0]?.length) {
        throw new Error("Embedding failed - empty vector returned");
      }

      // Push to Qdrant
      await QdrantVectorStore.fromDocuments(chunks, this.embeddings, {
        client: this.client,
        collectionName: this.collectionName,
        contentPayloadKey: "page_content",
        metadataPayloadKey: "metadata",
      });

      return {
        qdrant_doc_id: docId,
        chunk_count: chunks.length,
      };
    } catch (error) {
      console.error("Qdrant indexing error:", error);
      throw new Error(`Failed to index document: ${error.message}`);
    }
  }

  /**
   * Re-index document (xóa cũ, thêm mới)
   */
  async reindexDocument(qdrantDocId, plaintext, metadata) {
    try {
      await this.deleteDocument(qdrantDocId);
      return await this.indexDocument(plaintext, metadata, qdrantDocId);
    } catch (error) {
      throw new Error(`Failed to reindex document: ${error.message}`);
    }
  }

  /**
   * Xóa document khỏi Qdrant
   */
  async deleteDocument(qdrantDocId) {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: "metadata.doc_id",
              match: { value: qdrantDocId },
            },
          ],
        },
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete from Qdrant: ${error.message}`);
    }
  }

  /**
   * Semantic search
   */
  async search(query, filters = {}, limit = 5, scoreThreshold = 0.7) {
    try {
      const queryVector = await this.embeddings.embedQuery(query);

      // Build filter conditions
      const mustConditions = [];

      // Always search active documents only
      mustConditions.push({
        key: "metadata.active",
        match: { value: true },
      });

      if (filters.category) {
        mustConditions.push({
          key: "metadata.category",
          match: { value: filters.category },
        });
      }

      if (filters.mongo_id) {
        mustConditions.push({
          key: "metadata.mongo_id",
          match: { value: filters.mongo_id },
        });
      }

      // Search with score threshold
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit,
        filter: mustConditions.length > 0 ? { must: mustConditions } : undefined,
        with_payload: true,
        score_threshold: scoreThreshold,
      });

      return searchResult.map((r) => ({
        chunk_id: r.id,
        score: r.score,
        content: r.payload.page_content,
        metadata: r.payload.metadata,
      }));
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Update metadata (ví dụ: khi deactivate document)
   */
  async updateMetadata(qdrantDocId, metadataUpdates) {
    try {
      const scrollResult = await this.client.scroll(this.collectionName, {
        filter: {
          must: [
            {
              key: "metadata.doc_id",
              match: { value: qdrantDocId },
            },
          ],
        },
        limit: 1000,
        with_payload: true,
        with_vector: false,
      });

      if (scrollResult.points.length === 0) {
        throw new Error("Document not found in Qdrant");
      }

      const pointIds = scrollResult.points.map((p) => p.id);
      const currentMetadata = scrollResult.points[0].payload.metadata;

      await this.client.setPayload(this.collectionName, {
        points: pointIds,
        payload: {
          metadata: {
            ...currentMetadata,
            ...metadataUpdates,
            updated_at: new Date().toISOString(),
          },
        },
      });

      return { success: true, chunks_updated: pointIds.length };
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }
}

export default new QdrantService();