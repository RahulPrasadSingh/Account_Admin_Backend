import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String
    },
    imagePublicId: {
        type: String
    },
    category: {
        type: String,
        trim: true
    },
    tags: [String],
    isPublished: {
        type: Boolean,
        default: true
    },
    readTime: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;