/**
 * Services for handling file uploads and downloads
 */

// Download a GeoJSON file
export const downloadGeoJSON = (geojson: any, filename: string = 'export.geojson') => {
  const jsonStr = JSON.stringify(geojson, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Read a file as an ArrayBuffer
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && event.target.result instanceof ArrayBuffer) {
        resolve(event.target.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Validate if a file is a zip file (simple check)
export const isZipFile = (file: File): boolean => {
  return file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
};

// Validate file size
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};