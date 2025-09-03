import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist with absolute paths
const createUploadDirs = () => {
  const baseDir = process.cwd();
  const dirs = [
    path.join(baseDir, 'uploads', 'profile_images'),
    path.join(baseDir, 'uploads', 'property_images'),
    path.join(baseDir, 'uploads', 'property_videos'),
    path.join(baseDir, 'uploads', 'identity_documents'),
    path.join(baseDir, 'uploads', 'rules'),
    path.join(baseDir, 'uploads', 'chat_attachments'),
    path.join(baseDir, 'uploads', 'move_in_evidence'),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(process.cwd(), 'uploads');

    if (file.fieldname === 'profileImage') {
      uploadPath = path.join(uploadPath, 'profile_images');
    } else if (file.fieldname === 'propertyImages') {
      uploadPath = path.join(uploadPath, 'property_images');
    } else if (file.fieldname === 'propertyVideo') {
      uploadPath = path.join(uploadPath, 'property_videos');
    } else if (file.fieldname === 'identityDocument') {
      uploadPath = path.join(uploadPath, 'identity_documents');
    } else if (file.fieldname === 'rulesPdf') {
      uploadPath = path.join(uploadPath, 'rules');
    } else if (file.fieldname === 'attachment') {
      uploadPath = path.join(uploadPath, 'chat_attachments');
    } else if (file.fieldname === 'moveInEvidence' || file.fieldname === 'evidence') {
      uploadPath = path.join(uploadPath, 'move_in_evidence');
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  }
  // Allow videos
  else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  }
  // Allow PDFs for identity documents and rules
  else if (file.mimetype === 'application/pdf') {
    cb(null, true);
  }
  // Reject other file types
  else {
    cb(new Error('Only image, video, and PDF files are allowed!'), false);
  }
};

// Configure multer with different limits for different file types
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for general files
    files: 10, // Maximum 10 files
  },
});

// Configure multer for rules files with 10MB limit
const uploadRulesConfig = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only allow PDF, JPG, PNG for rules
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Rules file must be PDF, JPG, or PNG!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for rules files
    files: 1, // Maximum 1 rules file
  },
});

// Specific upload configurations
export const uploadProfileImage = upload.single('profileImage');

export const uploadPropertyImages = upload.array('propertyImages', 10); // Max 10 images

export const uploadPropertyVideo = upload.single('propertyVideo');

export const uploadIdentityDocument = upload.single('identityDocument');

export const uploadRulesPdf = uploadRulesConfig.single('rulesPdf');

export const uploadMultipleFiles = upload.fields([
  { name: 'propertyImages', maxCount: 10 },
  { name: 'propertyVideo', maxCount: 1 },
]);

export default upload;
