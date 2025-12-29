// import qdrantService from "~/services/qdrant.service";

// class DocumentController {
//   /**
//    * POST /api/documents
//    * Body: { page_content, metadata }
//    */
//   async addDocument(req, res) {
//     try {
//       const { page_content, metadata } = req.body;

//       if (!page_content) {
//         return res.status(400).json({
//           success: false,
//           message: "page_content is required",
//         });
//       }

//       const result = await qdrantService.addDocument(page_content, metadata || {});
//       res.status(201).json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * PUT /api/documents/:docId
//    * Body: { page_content, metadata }
//    */
//   async updateDocument(req, res) {
//     try {
//       const { docId } = req.params;
//       const { page_content, metadata } = req.body;

//       if (!page_content) {
//         return res.status(400).json({
//           success: false,
//           message: "page_content is required",
//         });
//       }

//       const result = await qdrantService.updateDocument(
//         docId,
//         page_content,
//         metadata || {}
//       );
//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * DELETE /api/documents/:docId
//    */
//   async deleteDocument(req, res) {
//     try {
//       const { docId } = req.params;
//       const result = await qdrantService.deleteDocument(docId);
//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * GET /api/documents/:docId
//    */
//   async getDocument(req, res) {
//     try {
//       const { docId } = req.params;
//       const result = await qdrantService.getDocumentById(docId);
      
//       if (!result.success) {
//         return res.status(404).json(result);
//       }

//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * GET /api/documents
//    * Query: ?category=service&active=true&limit=10&offset=xxx
//    */
//   async getAllDocuments(req, res) {
//     try {
//       const { category, active, limit = 100, offset } = req.query;

//       const filters = {};
//       if (category) filters.category = category;
//       if (active !== undefined) filters.active = active === "true";

//       const result = await qdrantService.getAllDocuments(
//         filters,
//         parseInt(limit),
//         offset || null
//       );
//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * POST /api/documents/search
//    * Body: { query, filters: { category, active, title }, limit }
//    */
//   async searchDocuments(req, res) {
//     try {
//       const { query, filters = {}, limit = 5 } = req.body;

//       if (!query) {
//         return res.status(400).json({
//           success: false,
//           message: "query is required",
//         });
//       }

//       const result = await qdrantService.searchDocuments(query, filters, limit);
//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }

//   /**
//    * PATCH /api/documents/:docId/metadata
//    * Body: { active, category, ... }
//    */
//   async updateMetadata(req, res) {
//     try {
//       const { docId } = req.params;
//       const metadataUpdates = req.body;

//       if (Object.keys(metadataUpdates).length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: "No metadata to update",
//         });
//       }

//       const result = await qdrantService.updateMetadata(docId, metadataUpdates);
//       res.json(result);
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }
//   }
// }

// export default new DocumentController();

// controllers/document.controller.js
import documentService from "~/services/document.service.js";

class DocumentController {
  /**
   * POST /api/documents
   * Body: { plaintext, html, tiptap_json, metadata }
   */
  async createDocument(req, res) {
    try {
      const result = await documentService.createDocument(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const result = await documentService.updateDocument(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/documents/:id
   * Query: ?hard=true (optional)
   */
  async deleteDocument(req, res) {
    try {
      const hardDelete = req.query.hard === "true";
      const result = await documentService.deleteDocument(req.params.id, hardDelete);
      res.json(result);
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/documents/:id
   */
  async getDocument(req, res) {
    try {
      const result = await documentService.getDocument(req.params.id);
      res.json(result);
    } catch (error) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/documents
   * Query: ?category=x&status=published&page=1&limit=20
   */
  async listDocuments(req, res) {
    try {
      const { category, status, active, tags, page, limit, sort } = req.query;

      const filters = {};
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (active !== undefined) filters.active = active === "true";
      if (tags) filters.tags = tags.split(",");

      const options = {};
      if (page) options.page = parseInt(page);
      if (limit) options.limit = parseInt(limit);
      if (sort) {
        try {
          options.sort = JSON.parse(sort);
        } catch {
          options.sort = { created_at: -1 };
        }
      }

      const result = await documentService.listDocuments(filters, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/documents/search
   * Body: { query, filters, limit }
   */
  async searchDocuments(req, res) {
    try {
      const { query, filters = {}, limit = 5 } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "query is required",
        });
      }

      const result = await documentService.searchDocuments(query, filters, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/documents/rebuild-index
   * Body: { mongo_id } (optional - nếu không có sẽ rebuild all)
   */
  async rebuildIndex(req, res) {
    try {
      const { mongo_id } = req.body;
      const result = await documentService.rebuildIndex(mongo_id);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new DocumentController();