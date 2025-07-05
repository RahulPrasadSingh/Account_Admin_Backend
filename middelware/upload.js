import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// To get __dirname in ES module (since you're likely using ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a safe upload directory relative to your project
const uploadDir = path.join(__dirname, "..", "uploads");

// Ensure the uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save uploaded images in "uploads/" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

export default upload;
