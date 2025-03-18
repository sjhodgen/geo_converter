import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useAppContext } from '../../context/AppContext';
import { useFeatureContext } from '../../context/FeatureContext';
import { processShapefile, flattenFeatureCollection } from '../../services/shapefileService';

const FileUploader: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setIsLoading, setError } = useAppContext();
  const { setFeatures, setOriginalData, setFileName } = useFeatureContext();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    try {
      console.log("File selected:", file.name, file.size);
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        setIsLoading(true);
        setUploadProgress(10); // Start with some progress
        
        // Progress management
        let progressInterval: NodeJS.Timeout | null = null;
        let processingTimeoutId: NodeJS.Timeout | null = null;
        
        // Create a promise that will reject if processing takes too long
        const timeoutPromise = new Promise((_, reject) => {
          processingTimeoutId = setTimeout(() => {
            reject(new Error('Processing timeout. The file might be too large or complex.'));
          }, 60000); // 1 minute timeout
        });
        
        // Start progress animation
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            // Gradually increase up to 95%
            return Math.min(prev + 3, 95);
          });
        }, 300);
        
        try {
          console.log("Starting shapefile processing");
          
          // Race between normal processing and timeout
          const result = await Promise.race([
            processShapefile(file),
            timeoutPromise
          ]) as any;
          
          console.log("Shapefile processing completed successfully", result);
          
          // Update progress to complete
          setUploadProgress(100);
          
          // Verify we have valid data before updating the context
          if (!result || !result.features || !Array.isArray(result.features)) {
            throw new Error('Invalid data structure received from shapefile processing');
          }
          
          console.log(`Loaded ${result.features.length} features from shapefile`);
          
          // Flatten any multipart features to make them individual features
          const flattenedCollection = flattenFeatureCollection(result);
          console.log(`Flattened collection: original features: ${result.features.length}, flattened features: ${flattenedCollection.features.length}`);
          
          // Update context with the processed and flattened data
          setFeatures(flattenedCollection.features);
          setOriginalData(result); // Keep original data for reference
          setFileName(file.name);
          
          setTimeout(() => {
            setUploadProgress(0);
            setIsLoading(false);
          }, 500);
        } finally {
          // Always clean up timers regardless of success or failure
          if (progressInterval) clearInterval(progressInterval);
          if (processingTimeoutId) clearTimeout(processingTimeoutId);
        }
      } else {
        throw new Error('Unsupported file format. Please upload a zipped Shapefile (.zip)');
      }
    } catch (error) {
      setError((error as Error).message);
      setUploadProgress(0);
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Data
      </Typography>
      
      <Paper
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.300',
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          mb: 2
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          accept=".zip"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        
        {uploadProgress > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress 
              variant="determinate" 
              value={uploadProgress} 
              size={40} 
              sx={{ my: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Processing file... {uploadProgress}%
            </Typography>
          </Box>
        ) : (
          <>
            <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" gutterBottom>
              Drag & Drop or Click to Upload
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports zipped Shapefile (.zip)
            </Typography>
          </>
        )}
      </Paper>
      
      <Alert severity="info" sx={{ mb: 1 }}>
        Files are processed locally in your browser - no data is uploaded to any server.
      </Alert>
    </Box>
  );
};

export default FileUploader;