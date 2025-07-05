import ClientageCategory from "../models/ClientageCategory.js";

// =============== CATEGORY MANAGEMENT ===============

// Create a new clientage category
export const createCategory = async (req, res) => {
    try {
        const { categoryName, clientTypes } = req.body;

        // Validate required fields
        if (!categoryName) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        if (!clientTypes || !Array.isArray(clientTypes) || clientTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Client types array is required and cannot be empty"
            });
        }

        // Check if category already exists
        const existingCategory = await ClientageCategory.findOne({ 
            categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category with this name already exists"
            });
        }

        // Create new category
        const newCategory = new ClientageCategory({
            categoryName,
            clientTypes: clientTypes.filter(type => type.trim()) // Remove empty strings
        });

        const savedCategory = await newCategory.save();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: savedCategory
        });

    } catch (error) {
        console.error("Error creating category:", error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await ClientageCategory.find()
            .sort({ categoryName: 1 });

        res.status(200).json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await ClientageCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, clientTypes } = req.body;

        const category = await ClientageCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if new category name already exists (excluding current category)
        if (categoryName && categoryName !== category.categoryName) {
            const existingCategory = await ClientageCategory.findOne({ 
                categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') },
                _id: { $ne: id }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Category with this name already exists"
                });
            }
        }

        // Prepare update object
        const updateData = {};
        
        if (categoryName) updateData.categoryName = categoryName;
        if (clientTypes && Array.isArray(clientTypes)) {
            updateData.clientTypes = clientTypes.filter(type => type.trim());
        }

        const updatedCategory = await ClientageCategory.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });

    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await ClientageCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await ClientageCategory.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Add client type to existing category
export const addClientType = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientType } = req.body;

        if (!clientType || !clientType.trim()) {
            return res.status(400).json({
                success: false,
                message: "Client type is required"
            });
        }

        const category = await ClientageCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check if client type already exists in this category
        if (category.clientTypes.includes(clientType.trim())) {
            return res.status(400).json({
                success: false,
                message: "Client type already exists in this category"
            });
        }

        category.clientTypes.push(clientType.trim());
        await category.save();

        res.status(200).json({
            success: true,
            message: "Client type added successfully",
            data: category
        });

    } catch (error) {
        console.error("Error adding client type:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Remove client type from category
export const removeClientType = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientType } = req.body;

        if (!clientType) {
            return res.status(400).json({
                success: false,
                message: "Client type is required"
            });
        }

        const category = await ClientageCategory.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Remove client type from array
        category.clientTypes = category.clientTypes.filter(type => type !== clientType);
        await category.save();

        res.status(200).json({
            success: true,
            message: "Client type removed successfully",
            data: category
        });

    } catch (error) {
        console.error("Error removing client type:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};