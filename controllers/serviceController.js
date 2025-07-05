import Service from "../models/Service.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

// Create a new service
export const createService = async (req, res) => {
    try {
        const { serviceName, description, detailBenefits, beneficiary } = req.body;

        // Validate required fields
        if (!serviceName || !description || !beneficiary) {
            return res.status(400).json({
                success: false,
                message: "Service name, description, and beneficiary are required"
            });
        }

        // Check if image file is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Service image is required"
            });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "ca-firm/services",
            resource_type: "image"
        });

        // Delete the temporary file
        fs.unlinkSync(req.file.path);

        // Parse detail benefits if it's a string
        let parsedBenefits = detailBenefits;
        if (typeof detailBenefits === 'string') {
            try {
                parsedBenefits = JSON.parse(detailBenefits);
            } catch (error) {
                // If it's not valid JSON, split by comma
                parsedBenefits = detailBenefits.split(',').map(benefit => benefit.trim());
            }
        }

        // Create new service
        const newService = new Service({
            serviceName,
            image: result.secure_url,
            description,
            detailBenefits: parsedBenefits,
            beneficiary
        });

        const savedService = await newService.save();

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: savedService
        });

    } catch (error) {
        console.error("Error creating service:", error);
        
        // Delete temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all services
export const getAllServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, isActive } = req.query;
        
        // Build filter object
        const filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const services = await Service.find(filter)
            .sort(options.sort)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);

        const total = await Service.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: services,
            pagination: {
                currentPage: options.page,
                totalPages: Math.ceil(total / options.limit),
                totalItems: total,
                itemsPerPage: options.limit
            }
        });

    } catch (error) {
        console.error("Error fetching services:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get service by ID
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        res.status(200).json({
            success: true,
            data: service
        });

    } catch (error) {
        console.error("Error fetching service:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update service
export const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, description, detailBenefits, beneficiary } = req.body;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Prepare update object
        const updateData = {};
        
        if (serviceName) updateData.serviceName = serviceName;
        if (description) updateData.description = description;
        if (beneficiary) updateData.beneficiary = beneficiary;

        // Handle detail benefits
        if (detailBenefits) {
            let parsedBenefits = detailBenefits;
            if (typeof detailBenefits === 'string') {
                try {
                    parsedBenefits = JSON.parse(detailBenefits);
                } catch (error) {
                    parsedBenefits = detailBenefits.split(',').map(benefit => benefit.trim());
                }
            }
            updateData.detailBenefits = parsedBenefits;
        }

        // Handle image update
        if (req.file) {
            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "ca-firm/services",
                resource_type: "image"
            });

            // Delete old image from Cloudinary (extract public_id from URL)
            const oldImagePublicId = service.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`ca-firm/services/${oldImagePublicId}`);

            updateData.image = result.secure_url;

            // Delete temporary file
            fs.unlinkSync(req.file.path);
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: updatedService
        });

    } catch (error) {
        console.error("Error updating service:", error);
        
        // Delete temporary file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete service
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Delete image from Cloudinary
        const imagePublicId = service.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`ca-firm/services/${imagePublicId}`);

        // Delete service from database
        await Service.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting service:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Toggle service status (active/inactive)
export const toggleServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        service.isActive = !service.isActive;
        await service.save();

        res.status(200).json({
            success: true,
            message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
            data: service
        });

    } catch (error) {
        console.error("Error toggling service status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};