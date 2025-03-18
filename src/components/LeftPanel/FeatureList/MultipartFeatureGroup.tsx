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
import SplitscreenIcon from '@mui/icons-material/Splitscreen';
import { useFeatureContext } from '../../../context/FeatureContext';
import FeatureItem from './FeatureItem';
import { GeoJSONFeature } from '../../../context/FeatureContext';

interface MultipartFeatureGroupProps {
  parentId: string | number;
  parentName: string;
  parts: GeoJSONFeature[];
  indentLevel?: number;
}

const MultipartFeatureGroup: React.FC<MultipartFeatureGroupProps> = ({ parentId, parentName, parts, indentLevel = 0 }) => {
  const [open, setOpen] = useState(true);
  const { selectedFeatures, setSelectedFeatures, isFeatureSelected } = useFeatureContext();
  
  // Handle toggle of the group expand/collapse
  const handleClick = () => {
    setOpen(!open);
  };
  
  // Check if all parts are selected
  const allSelected = parts.every(feature => isFeatureSelected(feature));
  // Check if some (but not all) parts are selected
  const someSelected = !allSelected && parts.some(feature => isFeatureSelected(feature));
  
  // Handle group selection toggle
  const handleGroupSelect = () => {
    if (allSelected) {
      // If all are selected, deselect all parts
      const newSelection = selectedFeatures.filter(
        f => !parts.some(part => 
          f.id === part.id || 
          JSON.stringify(f.geometry) === JSON.stringify(part.geometry)
        )
      );
      setSelectedFeatures(newSelection);
    } else {
      // If some or none are selected, select all parts
      const currentIds = selectedFeatures.map(f => f.id);
      const newFeatures = parts.filter(f => !currentIds.includes(f.id as string));
      setSelectedFeatures([...selectedFeatures, ...newFeatures]);
    }
  };
  
  // Calculate the left padding based on indent level
  const leftPadding = 16 + (indentLevel * 16);
  
  return (
    <>
      <ListItemButton 
        onClick={handleClick}
        dense
        sx={{ 
          bgcolor: open ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' },
          pl: `${leftPadding}px`
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
          <SplitscreenIcon fontSize="small" />
        </ListItemIcon>
        
        <ListItemText 
          primary={
            <Typography variant="body2" component="div">
              {parentName}
              <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                ({parts.length} parts)
              </Box>
            </Typography>
          }
        />
        
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ListItemButton>
      
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding dense>
          {parts.map((part, index) => (
            <FeatureItem
              key={`part-${part.id || index}`}
              feature={part}
              index={index}
              indentLevel={indentLevel + 1}
            />
          ))}
        </List>
      </Collapse>
    </>
  );
};

export default MultipartFeatureGroup;