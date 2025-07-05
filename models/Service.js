import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: [true, "Service name is required"],
        trim: true,
        maxlength: [100, "Service name cannot exceed 100 characters"]
    },
    image: {
        type: String,
        required: [true, "Service image is required"]
    },
    description: {
        type: String,
        required: [true, "Service description is required"],
        trim: true,
        maxlength: [5000, "Description cannot exceed 500 characters"]
    },
    detailBenefits: [{
        type: String,
        required: true,
        trim: true
    }],
    beneficiary: {
        type: String,
        required: [true, "Beneficiary information is required"],
        trim: true,
        maxlength: [2000, "Beneficiary cannot exceed 200 characters"]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for better search performance
serviceSchema.index({ serviceName: 1 });
serviceSchema.index({ isActive: 1 });

export default mongoose.model("Service", serviceSchema);