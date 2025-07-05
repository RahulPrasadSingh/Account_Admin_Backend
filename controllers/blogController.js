import Blog from '../models/Blog.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

// Helper function to calculate read time
const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'blog_images',
            resource_type: 'image',
            transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
            ]
        });
        
        // Delete local file after upload
        fs.unlinkSync(filePath);
        
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        // Clean up local file if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        throw error;
    }
};

// Helper function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
    }
};

// Get all blogs with pagination and filtering
export const getAllBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const filter = { isPublished: true };
        
        // Add category filter
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        // Add search functionality
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');
        
        const totalBlogs = await Blog.countDocuments(filter);
        const totalPages = Math.ceil(totalBlogs / limit);
        
        res.status(200).json({
            success: true,
            blogs,
            pagination: {
                currentPage: page,
                totalPages,
                totalBlogs,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs',
            error: error.message
        });
    }
};

// Get single blog by ID
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        res.status(200).json({
            success: true,
            blog
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog',
            error: error.message
        });
    }
};

// Create new blog
export const createBlog = async (req, res) => {
    try {
        const { title, content, author, category, tags, isPublished } = req.body;
        
        // Validate required fields
        if (!title || !content || !author) {
            return res.status(400).json({
                success: false,
                message: 'Title, content, and author are required'
            });
        }
        
        let imageUrl = null;
        let imagePublicId = null;
        
        // Handle image upload
        if (req.file) {
            try {
                const uploadResult = await uploadToCloudinary(req.file.path);
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image'
                });
            }
        }
        
        // Calculate read time
        const readTime = calculateReadTime(content);
        
        // Parse tags
        let parsedTags = [];
        if (tags) {
            parsedTags = typeof tags === 'string' ? 
                tags.split(',').map(tag => tag.trim()) : 
                tags;
        }
        
        const blog = new Blog({
            title,
            content,
            author,
            image: imageUrl,
            imagePublicId,
            category: category || null,
            tags: parsedTags,
            isPublished: isPublished !== undefined ? isPublished : true,
            readTime
        });
        
        await blog.save();
        
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog
        });
    } catch (error) {
        // Clean up uploaded file if error occurs
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating blog',
            error: error.message
        });
    }
};

// Update blog
export const updateBlog = async (req, res) => {
    try {
        const { title, content, author, category, tags, isPublished } = req.body;
        
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        let imageUrl = blog.image;
        let imagePublicId = blog.imagePublicId;
        
        // Handle new image upload
        if (req.file) {
            try {
                // Delete old image if exists
                if (blog.imagePublicId) {
                    await deleteFromCloudinary(blog.imagePublicId);
                }
                
                // Upload new image
                const uploadResult = await uploadToCloudinary(req.file.path);
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading image'
                });
            }
        }
        
        // Parse tags
        let parsedTags = blog.tags;
        if (tags) {
            parsedTags = typeof tags === 'string' ? 
                tags.split(',').map(tag => tag.trim()) : 
                tags;
        }
        
        // Update blog fields
        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.author = author || blog.author;
        blog.category = category !== undefined ? category : blog.category;
        blog.tags = parsedTags;
        blog.isPublished = isPublished !== undefined ? isPublished : blog.isPublished;
        blog.image = imageUrl;
        blog.imagePublicId = imagePublicId;
        
        // Recalculate read time if content changed
        if (content) {
            blog.readTime = calculateReadTime(content);
        }
        
        await blog.save();
        
        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            blog
        });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating blog',
            error: error.message
        });
    }
};

// Delete blog
export const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }
        
        // Delete image from Cloudinary if exists
        if (blog.imagePublicId) {
            await deleteFromCloudinary(blog.imagePublicId);
        }
        
        await Blog.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting blog',
            error: error.message
        });
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const categories = await Blog.distinct('category', { isPublished: true });
        res.status(200).json({
            success: true,
            categories: categories.filter(cat => cat !== null)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
};

// Get blogs by category
export const getBlogsByCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const blogs = await Blog.find({
            category: req.params.category,
            isPublished: true
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');
        
        const totalBlogs = await Blog.countDocuments({
            category: req.params.category,
            isPublished: true
        });
        
        const totalPages = Math.ceil(totalBlogs / limit);
        
        res.status(200).json({
            success: true,
            blogs,
            pagination: {
                currentPage: page,
                totalPages,
                totalBlogs,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blogs by category',
            error: error.message
        });
    }
};