import sharp from 'sharp';

/**
 * Optimize base64 image data for PDF embedding
 * @param {string} base64Data - Base64 image data (with or without data URL prefix)
 * @param {Object} options - Optimization options
 * @param {number} options.maxWidth - Maximum width in pixels (default: 800)
 * @param {number} options.quality - JPEG quality 0-100 (default: 70)
 * @param {string} options.format - Output format: 'jpeg' or 'png' (default: 'jpeg')
 * @returns {Promise<string>} - Optimized base64 data URL
 */
export const optimizeBase64Image = async (base64Data, options = {}) => {
  try {
    const { maxWidth = 800, quality = 70, format = 'jpeg' } = options;
    
    if (!base64Data) {
      return null;
    }

    // Remove data URL prefix if present
    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64WithoutPrefix, 'base64');
    
    // Process image with sharp
    let sharpInstance = sharp(buffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if image is larger than maxWidth
    if (metadata.width > maxWidth) {
      sharpInstance = sharpInstance.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }
    
    // Convert to specified format with quality settings
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    }
    
    // Convert back to base64
    const optimizedBuffer = await sharpInstance.toBuffer();
    const optimizedBase64 = optimizedBuffer.toString('base64');
    
    // Return as data URL
    return `data:image/${format};base64,${optimizedBase64}`;
    
  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    // Return original data if optimization fails
    return base64Data;
  }
};

/**
 * Optimize signature images specifically for contracts
 * @param {string} base64Data - Base64 signature data
 * @returns {Promise<string>} - Optimized signature data URL
 */
export const optimizeSignatureImage = async (base64Data) => {
  return optimizeBase64Image(base64Data, {
    maxWidth: 300, // Slightly smaller for better PDF compatibility
    quality: 80,   // Higher quality for better visibility
    format: 'png'  // Use PNG for better quality and transparency
  });
};

/**
 * Optimize property images for contracts
 * @param {string} base64Data - Base64 property image data
 * @returns {Promise<string>} - Optimized property image data URL
 */
export const optimizePropertyImage = async (base64Data) => {
  return optimizeBase64Image(base64Data, {
    maxWidth: 800, // Standard size for property images
    quality: 70,   // Good quality for property images
    format: 'jpeg'
  });
};

/**
 * Get optimized image dimensions for HTML embedding
 * @param {string} base64Data - Base64 image data
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {Promise<Object>} - { width, height } in pixels
 */
export const getOptimizedImageDimensions = async (base64Data, maxWidth = 800) => {
  try {
    if (!base64Data) {
      return { width: 0, height: 0 };
    }

    const base64WithoutPrefix = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64WithoutPrefix, 'base64');
    
    const metadata = await sharp(buffer).metadata();
    
    if (metadata.width <= maxWidth) {
      return { width: metadata.width, height: metadata.height };
    }
    
    // Calculate proportional height
    const ratio = maxWidth / metadata.width;
    const height = Math.round(metadata.height * ratio);
    
    return { width: maxWidth, height };
    
  } catch (error) {
    console.error('❌ Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
};
