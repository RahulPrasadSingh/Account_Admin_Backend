import mongoose from "mongoose";

const clientageCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        unique: true,
        maxlength: [100, "Category name cannot exceed 100 characters"]
    },
    clientTypes: [{
        type: String,
        required: true,
        trim: true,
        maxlength: [100, "Client type cannot exceed 100 characters"]
    }]
}, {
    timestamps: true
});



export default mongoose.model("ClientageCategory", clientageCategorySchema);