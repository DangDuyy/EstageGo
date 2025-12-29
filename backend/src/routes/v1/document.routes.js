// import express from "express";
// import documentController from "~/controllers/document.controller";

// const router = express.Router();

// // CRUD operations
// router.post("/", documentController.addDocument);
// router.get("/", documentController.getAllDocuments);
// router.get("/:docId", documentController.getDocument);
// router.put("/:docId", documentController.updateDocument);
// router.delete("/:docId", documentController.deleteDocument);

// // Search
// router.post("/search", documentController.searchDocuments);

// // Metadata update
// router.patch("/:docId/metadata", documentController.updateMetadata);

// export const documentRoutes = router;

import express from "express";
import documentController from "~/controllers/document.controller.js";

const router = express.Router();

// CRUD operations
router.post("/", documentController.createDocument);
router.get("/", documentController.listDocuments);
router.get("/:id", documentController.getDocument);
router.put("/:id", documentController.updateDocument);
router.delete("/:id", documentController.deleteDocument);

// Search
router.post("/search", documentController.searchDocuments);

// Admin operations
router.post("/rebuild-index", documentController.rebuildIndex);

export const documentRoutes = router;