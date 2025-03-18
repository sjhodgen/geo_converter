import React from 'react';
import { Paper } from '@mui/material';
import MapView from './MapView';
import MapControls from './MapControls';

const MapPanel: React.FC = () => {
  return (
    <Paper 
      elevation={0} 
      className="panel map-panel"
      sx={{ 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <MapView />
      <MapControls />
    </Paper>
  );
};

export default MapPanel;