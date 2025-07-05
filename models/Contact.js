import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"]
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"]
    },
    mobileNo: {
        type: String,
        required: [true, "Mobile number is required"],
        trim: true,
        validate: {
            validator: function(v) {
                return /^[+]?[\d\s()-]{10,15}$/.test(v);
            },
            message: "Please enter a valid mobile number"
        }
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: "Please enter a valid email address"
        }
    },
    service: {
        type: String,
        required: [true, "Service selection is required"],
        trim: true,
        maxlength: [100, "Service name cannot exceed 100 characters"]
    },
    query: {
        type: String,
        required: [true, "Query is required"],
        trim: true,
        maxlength: [1000, "Query cannot exceed 1000 characters"]
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'closed'],
        default: 'pending'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better search performance
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ isRead: 1 });
contactSchema.index({ createdAt: -1 });

export default mongoose.model("Contact", contactSchema);