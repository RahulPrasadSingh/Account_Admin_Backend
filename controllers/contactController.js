import Contact from "../models/Contact.js";

// Create a new contact inquiry
export const createContact = async (req, res) => {
    try {
        const { firstName, lastName, mobileNo, email, service, query } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !mobileNo || !email || !service || !query) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Create new contact inquiry
        const newContact = new Contact({
            firstName,
            lastName,
            mobileNo,
            email,
            service,
            query
        });

        const savedContact = await newContact.save();

        res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully. We will get back to you soon!",
            data: savedContact
        });

    } catch (error) {
        console.error("Error creating contact:", error);
        
        // Handle validation errors
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

// Get all contact inquiries (Admin only)
export const getAllContacts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            isRead, 
            service,
            search 
        } = req.query;
        
        // Build filter object
        const filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }
        
        if (service) {
            filter.service = { $regex: service, $options: 'i' };
        }
        
        // Search across multiple fields
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { service: { $regex: search, $options: 'i' } },
                { query: { $regex: search, $options: 'i' } }
            ];
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const contacts = await Contact.find(filter)
            .sort(options.sort)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit);

        const total = await Contact.countDocuments(filter);

        // Get statistics
        const stats = await Contact.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const unreadCount = await Contact.countDocuments({ isRead: false });

        res.status(200).json({
            success: true,
            data: contacts,
            pagination: {
                currentPage: options.page,
                totalPages: Math.ceil(total / options.limit),
                totalItems: total,
                itemsPerPage: options.limit
            },
            statistics: {
                statusBreakdown: stats,
                unreadCount
            }
        });

    } catch (error) {
        console.error("Error fetching contacts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get contact by ID
export const getContactById = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found"
            });
        }

        res.status(200).json({
            success: true,
            data: contact
        });

    } catch (error) {
        console.error("Error fetching contact:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update contact status (Admin only)
export const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'in-progress', 'resolved', 'closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Valid statuses are: pending, in-progress, resolved, closed"
            });
        }

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found"
            });
        }

        const updatedContact = await Contact.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Contact status updated successfully",
            data: updatedContact
        });

    } catch (error) {
        console.error("Error updating contact status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Mark contact as read/unread (Admin only)
export const toggleReadStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found"
            });
        }

        contact.isRead = !contact.isRead;
        await contact.save();

        res.status(200).json({
            success: true,
            message: `Contact marked as ${contact.isRead ? 'read' : 'unread'}`,
            data: contact
        });

    } catch (error) {
        console.error("Error toggling read status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete contact inquiry (Admin only)
export const deleteContact = async (req, res) => {
    try {
        const { id } = req.params;

        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact inquiry not found"
            });
        }

        await Contact.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Contact inquiry deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting contact:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get contact statistics (Admin only)
export const getContactStats = async (req, res) => {
    try {
        const totalContacts = await Contact.countDocuments();
        const unreadContacts = await Contact.countDocuments({ isRead: false });
        
        const statusStats = await Contact.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const serviceStats = await Contact.aggregate([
            {
                $group: {
                    _id: "$service",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Monthly contact trends (last 12 months)
        const monthlyStats = await Contact.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalContacts,
                unreadContacts,
                statusBreakdown: statusStats,
                topServices: serviceStats,
                monthlyTrends: monthlyStats
            }
        });

    } catch (error) {
        console.error("Error fetching contact stats:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};