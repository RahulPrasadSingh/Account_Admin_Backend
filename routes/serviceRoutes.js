import express from "express";
import upload from "../middelware/upload.js";
import {
    createService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    toggleServiceStatus
} from "../controllers/serviceController.js";

const router = express.Router();

// POST /api/services - Create a new service
router.post("/", upload.single("image"), createService);

// GET /api/services - Get all services with pagination and filtering
router.get("/", getAllServices);

// PATCH /api/services/:id/toggle-status - Toggle service active status (before /:id route)
router.patch("/:id/toggle-status", toggleServiceStatus);

// GET /api/services/:id - Get service by ID
router.get("/:id", getServiceById);

// PUT /api/services/:id - Update service
router.put("/:id", upload.single("image"), updateService);

// DELETE /api/services/:id - Delete service
router.delete("/:id", deleteService);

export default router;