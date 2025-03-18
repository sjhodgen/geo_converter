import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useFeatureContext, GeoJSONFeature } from '../../context/FeatureContext';
import { useAppContext } from '../../context/AppContext';

type ExportFormat = 'geojson';

const ExportControls: React.FC = () => {
  const [format, setFormat] = useState<ExportFormat>('geojson');
  const { features, selectedFeatures, fileName, originalData } = useFeatureContext();
  const { setError } = useAppContext();
  
  const handleFormatChange = (event: SelectChangeEvent) => {
    setFormat(event.target.value as ExportFormat);
  };
  
  const handleExport = () => {
    try {
      console.log("Total features available:", features.length);
      console.log("Selected features:", selectedFeatures.length);
      
      // IMPORTANT: Check if we should use original data if available - this ensures ALL polygons are included
      let featuresToExport: GeoJSONFeature[];
      
      if (selectedFeatures.length > 0) {
        // If user has selected features, use those
        console.log("Exporting selected features");
        featuresToExport = [...selectedFeatures];
      } else if (originalData && originalData.features.length > 0) {
        // Otherwise, prefer originalData if available as it contains the complete source data
        console.log("Exporting from original data:", originalData.features.length, "features");
        featuresToExport = [...originalData.features];
      } else {
        // Fallback to current features
        console.log("Exporting all current features");
        featuresToExport = [...features];
      }
      
      if (featuresToExport.length === 0) {
        setError('No features to export. Please import data first.');
        return;
      }
      
      console.log(`Exporting ${featuresToExport.length} features`);
      
      // Prepare features for export with properly formatted properties
      const preparedFeatures = featuresToExport.map((feature: GeoJSONFeature) => {
        // Create a deep copy to avoid reference issues
        const featureCopy = JSON.parse(JSON.stringify(feature));
        
        // Extract style information if it exists
        const styleInfo = featureCopy.properties?._style || {};
        
        // Default styles if none are set
        if (Object.keys(styleInfo).length === 0) {
          styleInfo.color = '#3388ff'; // Default blue
          styleInfo.lineWidth = 2;
          styleInfo.opacity = 80;
          styleInfo.fillPattern = 'solid';
        }
        
        // Create a single string for Notes property
        let notesText = "";
        
        if (featureCopy.properties) {
          // Build the notes string from properties
          Object.entries(featureCopy.properties).forEach(([key, value]) => {
            // Skip internal properties and style
            if (key.startsWith('_')) {
              return;
            }
            
            // Add this property to the notes string
            notesText += `${key}: ${value}\n`;
          });
        }
        
        // Create a clean properties object
        const exportProperties: Record<string, any> = {
          style: styleInfo // Use 'style' instead of '_style' for better compatibility
        };
        
        // Add Notes as a single string property if we have content
        if (notesText.trim().length > 0) {
          exportProperties.Notes = notesText.trim();
        }
        
        // Return a new feature with clean properties
        return {
          ...featureCopy,
          id: featureCopy.id,   // Ensure ID is preserved
          properties: exportProperties
        };
      });
    
      console.log(`Processed ${preparedFeatures.length} features for export`);
      
      // Create the GeoJSON object
      const geoJson = {
        type: 'FeatureCollection',
        features: preparedFeatures
      };
      
      // Convert to JSON string
      const jsonStr = JSON.stringify(geoJson, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Generate file name
      const baseFileName = fileName?.split('.')[0] || 'export';
      const exportFileName = selectedFeatures.length > 0
        ? `${baseFileName}_selection.geojson`
        : `${baseFileName}.geojson`;
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = exportFileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError(`Export failed: ${(error as Error).message}`);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Export
      </Typography>
      
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="export-format-label">Format</InputLabel>
        <Select
          labelId="export-format-label"
          id="export-format"
          value={format}
          label="Format"
          onChange={handleFormatChange}
        >
          <MenuItem value="geojson">GeoJSON</MenuItem>
        </Select>
      </FormControl>
      
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleExport}
        disabled={features.length === 0}
        fullWidth
      >
        {selectedFeatures.length > 0 ? 'Export Selected' : 'Export All'}
      </Button>
      
      {selectedFeatures.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {(() => {
            // Count distinct parent features
            const parentIds = new Set<string | number | undefined>();
            // Count stand-alone features (not parts of multipart)
            const standAloneFeatures: string[] = [];
            
            selectedFeatures.forEach(feature => {
              if (feature.properties && feature.properties._parentId !== undefined) {
                // This is a part of a multipart feature
                parentIds.add(feature.properties._parentId);
              } else {
                // This is a stand-alone feature
                standAloneFeatures.push(String(feature.id));
              }
            });
            
            // Total distinct features = parent multiparts + stand-alone features
            const distinctFeatureCount = parentIds.size + standAloneFeatures.length;
            
            return (
              <>
                {distinctFeatureCount} feature{distinctFeatureCount !== 1 ? 's' : ''} selected
                {selectedFeatures.some(f => f.properties && f.properties._parentId !== undefined) &&
                  ` (${selectedFeatures.length} total parts)`}
              </>
            );
          })()}
        </Alert>
      )}
    </Box>
  );
};

export default ExportControls;