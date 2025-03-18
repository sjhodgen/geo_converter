import React from 'react';
import {
  Box,
  Typography,
  List,
  Alert,
  Checkbox
} from '@mui/material';
import { useFeatureContext } from '../../../context/FeatureContext';
import FeatureItem from './FeatureItem';

const FeatureList: React.FC = () => {
  const { features, fileName, setSelectedFeatures, isFeatureSelected } = useFeatureContext();
  
  // Check if we have features to display
  const hasFeatures = features.length > 0;
  
  // Check if all features are selected
  const allSelected = features.length > 0 && features.every(feature => isFeatureSelected(feature));
  
  // Handle toggle of all features
  const handleToggleAll = () => {
    if (allSelected) {
      // Deselect all features
      setSelectedFeatures([]);
    } else {
      // Select all features
      setSelectedFeatures([...features]);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Features
      </Typography>
      
      {!hasFeatures ? (
        <Alert severity="info">
          Import a shapefile to see features listed here.
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              File: {fileName}
            </Typography>
            
            {features.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  size="small"
                  checked={allSelected}
                  onChange={handleToggleAll}
                />
                <Typography variant="caption" color="text.secondary">
                  Select all
                </Typography>
              </Box>
            )}
          </Box>
          
          <List dense disablePadding>
            {/* All features displayed in a flat list */}
            {features.map((feature, index) => (
              <FeatureItem
                key={`feature-${feature.id || index}`}
                feature={feature}
                index={index}
              />
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default FeatureList;