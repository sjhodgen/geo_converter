import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useFeatureContext } from '../../../context/FeatureContext';
import PropertyTable from './PropertyTable';
import PropertyControls from './PropertyControls';

const PropertyEditor: React.FC = () => {
  const { selectedFeatures } = useFeatureContext();
  const hasSelection = selectedFeatures.length > 0;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Properties
      </Typography>
      
      {!hasSelection ? (
        <Alert severity="info">
          Select features to view and edit properties.
        </Alert>
      ) : (
        <>
          <PropertyTable />
          <PropertyControls />
        </>
      )}
    </Box>
  );
};

export default PropertyEditor;