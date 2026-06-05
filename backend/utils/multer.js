import multer from "multer";
import path from "path";

// ✅ Folder jahan images save hongi
const uploadDir = "uploads/platform-logos";

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // file extension
    cb(null, `${Date.now()}${ext}`); // filename = timestamp + ext
  },
});

// ✅ Multer instance
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

export default upload;
