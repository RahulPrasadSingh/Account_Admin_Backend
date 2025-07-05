import express from 'express';
import upload from '../middelware/upload.js';
import {
    getAllBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    getCategories,
    getBlogsByCategory
} from '../controllers/blogController.js';

const router = express.Router();

// Get all categories - This needs to be BEFORE the /:id route
router.get('/categories', getCategories);

// Get blogs by category - This needs to be BEFORE the /:id route
router.get('/category/:category', getBlogsByCategory);

// Get all blogs with pagination and filtering
router.get('/', getAllBlogs);

// Get single blog by ID
router.get('/:id', getBlogById);

// Create new blog with image upload
router.post('/', upload.single('image'), createBlog);

// Update blog
router.put('/:id', upload.single('image'), updateBlog);

// Delete blog
router.delete('/:id', deleteBlog);

export default router;