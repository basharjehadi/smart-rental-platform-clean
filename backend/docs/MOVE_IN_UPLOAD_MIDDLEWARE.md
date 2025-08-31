# Move-In Issue Upload Middleware

This middleware handles file uploads for move-in issues with validation and metadata extraction.

## Features

- **File Type Validation**: Accepts only `image/jpeg`, `image/png`, `application/pdf`, `video/mp4`
- **Size Limit**: Maximum 10 MB per file
- **File Count**: Maximum 5 files per request
- **Metadata Extraction**: Automatically extracts `path`, `mime`, `size`, and `sha256` hash
- **Secure Naming**: Generates unique filenames with timestamps and random strings

## Usage

### Multiple Files Upload

```javascript
import { moveInIssueUpload } from '../middlewares/moveInIssueUpload.js';

// Route for multiple file uploads
router.post('/move-in-issues/:id/evidence', 
  moveInIssueUpload, 
  async (req, res) => {
    // Access uploaded files metadata
    const files = req.uploadedFiles;
    
    // Each file has: path, mime, size, sha256, originalName, filename
    console.log('Uploaded files:', files);
    
    res.json({ success: true, files });
  }
);
```

### Single File Upload

```javascript
import { moveInIssueUploadSingle } from '../middlewares/moveInIssueUpload.js';

// Route for single file upload
router.post('/move-in-issues/:id/evidence', 
  moveInIssueUploadSingle, 
  async (req, res) => {
    // Access uploaded file metadata
    const file = req.uploadedFile;
    
    // File has: path, mime, size, sha256, originalName, filename
    console.log('Uploaded file:', file);
    
    res.json({ success: true, file });
  }
);
```

## File Metadata Structure

```javascript
{
  path: "uploads/move-in-issues/movein_1234567890_abc123def456.jpg",
  mime: "image/jpeg",
  size: 2048576, // bytes
  sha256: "a1b2c3d4e5f6...", // SHA256 hash
  originalName: "photo.jpg",
  filename: "movein_1234567890_abc123def456.jpg"
}
```

## Error Handling

The middleware returns clear 400 error messages for violations:

- **File too large**: "Maximum file size is 10 MB"
- **Invalid file type**: "Invalid file type. Allowed types: image/jpeg, image/png, application/pdf, video/mp4"
- **Too many files**: "Maximum 5 files allowed per request"

## File Storage

Files are stored in `uploads/move-in-issues/` directory with the following naming convention:
```
movein_{timestamp}_{randomString}.{extension}
```

Example: `movein_1693456789123_a1b2c3d4.jpg`

## Security Features

- **Unique filenames**: Prevents filename conflicts and path traversal attacks
- **SHA256 hashing**: Provides file integrity verification
- **MIME type validation**: Ensures only allowed file types are uploaded
- **Size limits**: Prevents large file uploads that could cause DoS

## Frontend Integration

```javascript
// Example frontend form submission
const formData = new FormData();
formData.append('files', fileInput.files[0]);

fetch('/api/move-in-issues/123/evidence', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Upload successful:', data.files);
})
.catch(error => {
  console.error('Upload failed:', error);
});
```
