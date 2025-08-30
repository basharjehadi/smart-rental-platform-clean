import multer from 'multer';
import path from 'path';
import fs from 'fs';

const baseDir = process.cwd();
const chatDir = path.join(baseDir, 'uploads', 'chat_attachments');
if (!fs.existsSync(chatDir)) {
  fs.mkdirSync(chatDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'attachment-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow common doc/image types
  const allowed = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Unsupported attachment type'), false);
};

export const uploadChatAttachment = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
});

export default uploadChatAttachment;
