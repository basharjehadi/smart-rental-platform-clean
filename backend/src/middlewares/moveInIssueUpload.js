import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/move-in-issues';
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `movein_${timestamp}_${randomString}${extension}`;
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png', 
    'application/pdf',
    'video/mp4'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

// Configure multer with validation
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5 // Maximum 5 files per request
  }
});

// Middleware function
export const moveInIssueUpload = (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'Maximum file size is 10 MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files',
          message: 'Maximum 5 files allowed per request'
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        error: 'File validation error',
        message: err.message
      });
    }

    // Process uploaded files and extract metadata
    if (req.files && req.files.length > 0) {
      req.uploadedFiles = req.files.map(file => {
        // Calculate SHA256 hash
        const fileBuffer = fs.readFileSync(file.path);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        
        return {
          path: file.path,
          mime: file.mimetype,
          size: file.size,
          sha256: sha256,
          originalName: file.originalname,
          filename: file.filename
        };
      });
    }

    next();
  });
};

// Single file upload version
export const moveInIssueUploadSingle = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'Maximum file size is 10 MB'
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: err.message
      });
    } else if (err) {
      return res.status(400).json({
        error: 'File validation error',
        message: err.message
      });
    }

    // Process uploaded file and extract metadata
    if (req.file) {
      // Calculate SHA256 hash
      const fileBuffer = fs.readFileSync(req.file.path);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      req.uploadedFile = {
        path: req.file.path,
        mime: req.file.mimetype,
        size: req.file.size,
        sha256: sha256,
        originalName: req.file.originalname,
        filename: req.file.filename
      };
    }

    next();
  });
};

export default moveInIssueUpload;
