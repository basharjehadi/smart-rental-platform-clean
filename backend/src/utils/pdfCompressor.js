import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Compress PDF using Ghostscript
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path to output compressed PDF file
 * @param {string} quality - Compression quality: 'screen', 'ebook', 'printer', 'prepress'
 * @returns {Promise<Object>} - Compression result with file size info
 */
export const compressPDF = async (inputPath, outputPath, quality = 'ebook') => {
  try {
    console.log(`🔧 Compressing PDF: ${path.basename(inputPath)}`);
    
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input PDF file not found: ${inputPath}`);
    }
    
    // Get original file size
    const originalSize = fs.statSync(inputPath).size;
    console.log(`📄 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Ghostscript command for PDF compression
    const gsCommand = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/${quality} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
    
    // Execute Ghostscript
    const { stdout, stderr } = await execAsync(gsCommand);
    
    if (stderr && !stderr.includes('Processing pages')) {
      console.warn('⚠️ Ghostscript warnings:', stderr);
    }
    
    // Check if output file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Compressed PDF file was not created');
    }
    
    // Get compressed file size
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% reduction)`);
    
    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: parseFloat(compressionRatio),
      outputPath
    };
    
  } catch (error) {
    console.error('❌ Error compressing PDF:', error);
    
    // If Ghostscript fails, return the original file
    if (fs.existsSync(inputPath)) {
      console.log('⚠️ Using original PDF due to compression failure');
      return {
        success: false,
        originalSize: fs.statSync(inputPath).size,
        compressedSize: fs.statSync(inputPath).size,
        compressionRatio: 0,
        outputPath: inputPath,
        error: error.message
      };
    }
    
    throw error;
  }
};

/**
 * Compress PDF with fallback options
 * @param {string} inputPath - Path to input PDF file
 * @param {string} outputPath - Path to output compressed PDF file
 * @returns {Promise<Object>} - Compression result
 */
export const compressPDFWithFallback = async (inputPath, outputPath) => {
  // Try different compression levels
  const compressionLevels = ['ebook', 'screen', 'printer'];
  
  for (const level of compressionLevels) {
    try {
      const result = await compressPDF(inputPath, outputPath, level);
      
      // If compression was successful and file size is reasonable, use it
      if (result.success && result.compressedSize < 1024 * 1024) { // Under 1MB
        return result;
      }
      
      // If file is still too large, try next level
      if (result.success && result.compressedSize < result.originalSize) {
        console.log(`📄 File still large (${(result.compressedSize / 1024 / 1024).toFixed(2)} MB), trying next compression level...`);
        continue;
      }
      
    } catch (error) {
      console.warn(`⚠️ Compression level '${level}' failed:`, error.message);
      continue;
    }
  }
  
  // If all compression levels fail, return original file
  console.log('⚠️ All compression levels failed, using original PDF');
  return {
    success: false,
    originalSize: fs.statSync(inputPath).size,
    compressedSize: fs.statSync(inputPath).size,
    compressionRatio: 0,
    outputPath: inputPath,
    error: 'All compression levels failed'
  };
};

/**
 * Check if Ghostscript is available on the system
 * @returns {Promise<boolean>} - True if Ghostscript is available
 */
export const checkGhostscriptAvailability = async () => {
  try {
    const { stdout } = await execAsync('gs --version');
    console.log(`✅ Ghostscript available: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.warn('⚠️ Ghostscript not available, PDF compression will be skipped');
    return false;
  }
};


