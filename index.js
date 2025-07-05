import express from 'express';
import dotenv from 'dotenv';
import {connectDB} from './lib/db.js';
import serviceRoutes from './routes/serviceRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import clientageRoutes from './routes/clientageRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/services', serviceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/clientage', clientageRoutes);
app.use('/api/blogs', blogRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running successfully',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    
    // Connect to the database
    connectDB();
});



