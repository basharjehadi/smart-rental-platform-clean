import express from 'express';

/**
 * Setup static file serving with CORS headers
 * @param {Express} app - Express application instance
 */
export const setupStaticFiles = (app) => {
  const staticOptions = {
    setHeaders: (res) => {
      res.header(
        'Access-Control-Allow-Origin',
        process.env.FRONTEND_URL || 'http://localhost:5173'
      );
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
    },
  };

  // Serve all uploads with CORS headers
  app.use(
    '/uploads',
    (req, res, next) => {
      staticOptions.setHeaders(res);
      next();
    },
    express.static('uploads')
  );

  // Serve specific upload directories
  const uploadDirs = [
    'profile_images',
    'property_images',
    'property_videos',
    'identity_documents',
    'rules',
    'contracts',
    'chat_attachments',
    'move_in_evidence',
  ];

  uploadDirs.forEach((dir) => {
    app.use(
      `/uploads/${dir}`,
      (req, res, next) => {
        staticOptions.setHeaders(res);
        next();
      },
      express.static(`uploads/${dir}`)
    );
  });
};
