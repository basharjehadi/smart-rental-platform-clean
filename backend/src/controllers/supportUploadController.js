import path from 'path';

export const uploadMultipleAttachments = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return res
        .status(400)
        .json({ success: false, error: 'No files uploaded' });
    }

    const attachments = files.map((file) => ({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: `/uploads/chat_attachments/${path.basename(file.path)}`,
    }));

    return res.status(201).json({ success: true, attachments });
  } catch (error) {
    console.error('Upload attachments error:', error);
    return res
      .status(500)
      .json({ success: false, error: 'Failed to upload attachments' });
  }
};
