import express from "express";
import {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
    addClientType,
    removeClientType
} from "../controllers/clientageController.js";

const router = express.Router();

// POST /api/clientage - Create a new category
router.post("/", createCategory);

// GET /api/clientage - Get all categories
router.get("/", getAllCategories);

// GET /api/clientage/:id - Get category by ID
router.get("/:id", getCategoryById);

// PUT /api/clientage/:id - Update category
router.put("/:id", updateCategory);

// DELETE /api/clientage/:id - Delete category
router.delete("/:id", deleteCategory);

// POST /api/clientage/:id/client-types - Add client type to category
router.post("/:id/client-types", addClientType);

// DELETE /api/clientage/:id/client-types - Remove client type from category
router.delete("/:id/client-types", removeClientType);

export default router;