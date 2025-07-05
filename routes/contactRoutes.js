import express from "express";
import {
    createContact,
    getAllContacts,
    getContactById,
    updateContactStatus,
    toggleReadStatus,
    deleteContact,
    getContactStats
} from "../controllers/contactController.js";

const router = express.Router();

// POST /api/contacts - Create a new contact inquiry (Public route)
router.post("/", createContact);

// GET /api/contacts/stats - Get contact statistics (Admin route)
router.get("/stats", getContactStats);

// GET /api/contacts - Get all contact inquiries with filtering (Admin route)
router.get("/", getAllContacts);

// PATCH /api/contacts/:id/read-status - Toggle read status (Admin route)
router.patch("/:id/read-status", toggleReadStatus);

// PATCH /api/contacts/:id/status - Update contact status (Admin route)
router.patch("/:id/status", updateContactStatus);

// GET /api/contacts/:id - Get contact by ID (Admin route)
router.get("/:id", getContactById);

// DELETE /api/contacts/:id - Delete contact inquiry (Admin route)
router.delete("/:id", deleteContact);

export default router;