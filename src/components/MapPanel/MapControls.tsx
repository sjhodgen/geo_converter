import React from 'react';
import { Box, IconButton, Paper, Divider, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import HomeIcon from '@mui/icons-material/Home';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import LayersIcon from '@mui/icons-material/Layers';
import { useMapContext } from '../../context/MapContext';
import { useFeatureContext } from '../../context/FeatureContext';

// Wrapper component that provides the map control UI
const MapControls: React.FC = () => {
  const { setSelectionMode, selectionMode } = useMapContext();
  const { features, clearSelection } = useFeatureContext();
  
  const handleZoomIn = () => {
    // In a real implementation, we'd use Leaflet's methods
    console.log('Zoom in');
  };
  
  const handleZoomOut = () => {
    // In a real implementation, we'd use Leaflet's methods
    console.log('Zoom out');
  };
  
  const handleHome = () => {
    // In a real implementation, we'd fit bounds to all features
    console.log('Reset view');
  };
  
  const handleToggleSelection = () => {
    if (selectionMode === 'rectangle') {
      setSelectionMode(null);
    } else {
      setSelectionMode('rectangle');
      clearSelection();
    }
  };
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 0.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        <Tooltip title="Zoom in" placement="left">
          <IconButton onClick={handleZoomIn} size="small">
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom out" placement="left">
          <IconButton onClick={handleZoomOut} size="small">
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Divider sx={{ my: 0.5 }} />
        
        <Tooltip title="Reset view" placement="left">
          <IconButton onClick={handleHome} size="small">
            <HomeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Select features" placement="left">
          <IconButton 
            onClick={handleToggleSelection} 
            size="small" 
            color={selectionMode === 'rectangle' ? 'primary' : 'default'}
          >
            <SelectAllIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Divider sx={{ my: 0.5 }} />
        
        <Tooltip title="Base maps" placement="left">
          <IconButton size="small">
            <LayersIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default MapControls;