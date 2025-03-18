import React, { useState } from 'react';
import { 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse,
  Checkbox,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RoomIcon from '@mui/icons-material/Room';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShapeLineIcon from '@mui/icons-material/ShapeLine';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useFeatureContext } from '../../../context/FeatureContext';
import FeatureItem from './FeatureItem';
import { GeoJSONFeature } from '../../../context/FeatureContext';

interface FeatureGroupProps {
  title: string;
  features: GeoJSONFeature[];
  count: number;
  type: 'point' | 'line' | 'polygon' | 'other';
}

const FeatureGroup: React.FC<FeatureGroupProps> = ({ title, features, count, type }) => {
  const [open, setOpen] = useState(true);
  const { selectedFeatures, setSelectedFeatures, isFeatureSelected } = useFeatureContext();
  
  const getIcon = () => {
    switch (type) {
      case 'point':
        return <RoomIcon fontSize="small" />;
      case 'line':
        return <TimelineIcon fontSize="small" />;
      case 'polygon':
        return <ShapeLineIcon fontSize="small" />;
      default:
        return <HelpOutlineIcon fontSize="small" />;
    }
  };
  
  // Handle toggle of the group expand/collapse
  const handleClick = () => {
    setOpen(!open);
  };
  
  // Check if all features in this group are selected
  const allSelected = features.every(feature => isFeatureSelected(feature));
  // Check if some (but not all) features in this group are selected
  const someSelected = !allSelected && features.some(feature => isFeatureSelected(feature));
  
  // Handle group selection toggle
  const handleGroupSelect = () => {
    if (allSelected) {
      // If all are selected, deselect all in this group
      const newSelection = selectedFeatures.filter(
        f => !features.some(groupFeature => 
          f.id === groupFeature.id || 
          JSON.stringify(f.geometry) === JSON.stringify(groupFeature.geometry)
        )
      );
      setSelectedFeatures(newSelection);
    } else {
      // If some or none are selected, select all in this group
      const currentIds = selectedFeatures.map(f => f.id);
      const newFeatures = features.filter(f => !currentIds.includes(f.id));
      setSelectedFeatures([...selectedFeatures, ...newFeatures]);
    }
  };
  
  return (
    <>
      <ListItemButton 
        onClick={handleClick}
        dense
        sx={{ 
          bgcolor: open ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={allSelected}
            indeterminate={someSelected}
            onChange={handleGroupSelect}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
        </ListItemIcon>
        
        <ListItemIcon sx={{ minWidth: 36 }}>
          {getIcon()}
        </ListItemIcon>
        
        <ListItemText 
          primary={
            <Typography variant="body2" component="div">
              {title}
              <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                ({count})
              </Box>
            </Typography>
          }
        />
        
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>
      
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding dense>
          {features.map((feature, index) => (
            <FeatureItem
              key={`${type}-${feature.id || index}`}
              feature={feature}
              index={index}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
};

export default FeatureGroup;