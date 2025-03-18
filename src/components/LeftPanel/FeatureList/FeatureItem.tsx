import React from 'react';
import { 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Checkbox,
  Typography,
  Tooltip
} from '@mui/material';
import { useFeatureContext } from '../../../context/FeatureContext';
import { GeoJSONFeature } from '../../../context/FeatureContext';

interface FeatureItemProps {
  feature: GeoJSONFeature;
  index: number;
  indentLevel?: number;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature, index, indentLevel = 0 }) => {
  const { toggleFeatureSelection, isFeatureSelected } = useFeatureContext();
  
  // Get a display name for the feature
  const getFeatureName = (): string => {
    // For parts of a multi-part feature, show part index
    if (feature.properties && feature.properties._partIndex !== undefined) {
      return `Part ${feature.properties._partIndex + 1}`;
    }
    
    if (feature.properties && feature.properties.name) {
      return feature.properties.name;
    }
    
    if (feature.properties && feature.properties.NAME) {
      return feature.properties.NAME;
    }
    
    if (feature.properties && feature.properties.id) {
      return `Feature ${feature.properties.id}`;
    }
    
    if (feature.id) {
      return `Feature ${feature.id}`;
    }
    
    return `Feature ${index + 1}`;
  };
  
  // Handle checkbox toggle
  const handleToggle = () => {
    toggleFeatureSelection(feature);
  };
  
  // Handle click on the whole item (also toggles selection)
  const handleClick = () => {
    toggleFeatureSelection(feature);
  };
  
  const isSelected = isFeatureSelected(feature);
  const featureName = getFeatureName();
  
  return (
    <ListItem
      disablePadding
    >
      <ListItemButton
        onClick={handleClick}
        dense
        selected={isSelected}
        sx={{
          pl: 1, // Minimum padding for left alignment
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.20)',
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          <Checkbox
            edge="start"
            checked={isSelected}
            onChange={handleToggle}
            size="small"
            onClick={(e) => e.stopPropagation()}
          />
        </ListItemIcon>
        
        <Tooltip title={Object.entries(feature.properties || {})
            .filter(([key]) => !key.startsWith('_')) // Filter out internal properties
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n')} 
          arrow
        >
          <ListItemText
            primary={
              <Typography variant="body2" noWrap>
                {featureName}
              </Typography>
            }
          />
        </Tooltip>
      </ListItemButton>
    </ListItem>
  );
};

export default FeatureItem;