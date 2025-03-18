import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Paper,
  IconButton,
  Tab,
  Tabs,
  Stack
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useFeatureContext, GeoJSONFeature } from '../../context/FeatureContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`geojson-tabpanel-${index}`}
      aria-labelledby={`geojson-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%', pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ViewGeoJsonButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [copySuccess, setCopySuccess] = useState('');
  const { features, selectedFeatures, originalData } = useFeatureContext();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCopySuccess('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopySuccess('Copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Prepare data for different views - always make copies to avoid reference issues
  let currentFeatures: GeoJSONFeature[];
  
  if (selectedFeatures.length > 0) {
    // If user has selected features, use those
    console.log("Viewing selected features");
    currentFeatures = [...selectedFeatures];
  } else if (tabValue === 1 && originalData) {
    // If on original data tab, use original data
    console.log("Viewing original data:", originalData.features.length, "features");
    currentFeatures = [...originalData.features];
  } else {
    // Otherwise use current features
    console.log("Viewing all current features");
    currentFeatures = [...features];
  }
  
  console.log("View GeoJSON showing:", currentFeatures.length, "features");
  
  // Prepare features for display with consistent formatting
  const preparedFeatures = currentFeatures.map((feature: GeoJSONFeature) => {
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
    
    // Combine all regular properties into a single string with newlines
    let notesString = "";
    
    if (featureCopy.properties) {
      // Build the notes string from properties
      Object.entries(featureCopy.properties).forEach(([key, value]) => {
        // Skip internal properties and style
        if (key.startsWith('_')) {
          return;
        }
        
        // Add this property to the notes string
        notesString += `${key}: ${value}\n`;
      });
    }
    
    // Create properties object with Notes as string and style
    const displayProperties: Record<string, any> = {
      style: styleInfo // Use 'style' instead of '_style' for better compatibility
    };
    
    // Only add Notes if there's actual content
    if (notesString.trim().length > 0) {
      displayProperties.Notes = notesString.trim();
    }
    
    // Return a new feature with clean properties
    return {
      ...featureCopy,
      id: featureCopy.id,   // Ensure ID is preserved
      properties: displayProperties
    };
  });
  
  const currentGeoJson = {
    type: 'FeatureCollection',
    features: preparedFeatures
  };

  const formattedCurrentGeoJson = JSON.stringify(currentGeoJson, null, 2);
  const formattedOriginalGeoJson = originalData ? JSON.stringify(originalData, null, 2) : '';

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CodeIcon />}
        onClick={handleOpen}
        disabled={features.length === 0}
        fullWidth
        sx={{ mt: 2 }}
      >
        View GeoJSON
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">GeoJSON Data</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Current Data" id="geojson-tab-0" />
            {originalData && <Tab label="Original Data" id="geojson-tab-1" />}
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedFeatures.length > 0 
                  ? `Showing ${selectedFeatures.length} selected features` 
                  : `Showing all ${features.length} features`}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleCopy(formattedCurrentGeoJson)}
                title="Copy to clipboard"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              {copySuccess && (
                <Typography variant="caption" color="success.main">
                  {copySuccess}
                </Typography>
              )}
            </Stack>
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                height: 'calc(100% - 40px)',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              {formattedCurrentGeoJson}
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Original imported data
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleCopy(formattedOriginalGeoJson)}
                title="Copy to clipboard"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              {copySuccess && (
                <Typography variant="caption" color="success.main">
                  {copySuccess}
                </Typography>
              )}
            </Stack>
            <Paper 
              elevation={0} 
              sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                height: 'calc(100% - 40px)',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              {formattedOriginalGeoJson}
            </Paper>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ViewGeoJsonButton;