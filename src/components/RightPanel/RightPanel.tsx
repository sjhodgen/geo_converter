import React from 'react';
import { Paper, Divider, Box } from '@mui/material';
import BulkEditTools from './BulkEditTools';
import StyleOptions from './StyleOptions';

const RightPanel: React.FC = () => {
  // Panel content is handled by child components
  
  return (
    <Paper elevation={0} className="panel right-panel">
      <Box className="panel-section">
        <BulkEditTools />
      </Box>
      
      <Divider />
      
      <Box className="panel-section">
        <StyleOptions />
      </Box>
    </Paper>
  );
};

export default RightPanel;