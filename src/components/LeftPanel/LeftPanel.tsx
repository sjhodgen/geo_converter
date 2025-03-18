import React from 'react';
import FileUploader from './FileUploader';
import FeatureList from './FeatureList/FeatureList';
import ExportControls from './ExportControls';
import ViewGeoJsonButton from './ViewGeoJsonButton';
import { Paper, Divider, Box } from '@mui/material';

const LeftPanel: React.FC = () => {
  return (
    <Paper elevation={0} className="panel left-panel">
      <Box className="panel-section">
        <FileUploader />
      </Box>
      
      <Divider />
      
      <Box className="panel-section" sx={{ flex: 1, overflow: 'auto' }}>
        <FeatureList />
      </Box>
      
      <Divider />
      
      <Box className="panel-section">
        <ExportControls />
        <ViewGeoJsonButton />
      </Box>
    </Paper>
  );
};

export default LeftPanel;