import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Alert,
  Button
} from '@mui/material';
import { useFeatureContext } from '../../context/FeatureContext';
import { getFeatureType } from '../../services/shapefileService';

// Define common colors for GIS features
const colorOptions = [
  { name: 'Blue', value: '#3388ff' },
  { name: 'Red', value: '#ff3333' },
  { name: 'Green', value: '#33cc33' },
  { name: 'Orange', value: '#ff9900' },
  { name: 'Purple', value: '#9966ff' },
  { name: 'Yellow', value: '#ffcc00' },
  { name: 'Pink', value: '#ff66cc' },
  { name: 'Teal', value: '#33cccc' },
];

const StyleOptions: React.FC = () => {
  const { selectedFeatures, features, setFeatures } = useFeatureContext();
  const hasSelection = selectedFeatures.length > 0;
  
  // Get the type of the first selected feature (for conditional rendering)
  const featureType = hasSelection ? getFeatureType(selectedFeatures[0]) : null;
  const isPoint = featureType === 'point';
  const isLine = featureType === 'line';
  const isPolygon = featureType === 'polygon';
  
  // State for style options
  const [color, setColor] = useState('#3388ff');
  const [lineWidth, setLineWidth] = useState(2);
  const [opacity, setOpacity] = useState(80);
  const [fillPattern, setFillPattern] = useState('solid');
  
  // Initialize style values from the first selected feature if it has style properties
  useEffect(() => {
    if (hasSelection && selectedFeatures[0].properties) {
      const props = selectedFeatures[0].properties;
      
      if (props._style) {
        if (props._style.color) setColor(props._style.color);
        if (props._style.lineWidth) setLineWidth(props._style.lineWidth);
        if (props._style.opacity) setOpacity(props._style.opacity);
        if (props._style.fillPattern) setFillPattern(props._style.fillPattern);
      }
    }
  }, [selectedFeatures, hasSelection]);
  
  // Apply styles to selected features
  const applyStyles = () => {
    if (!hasSelection) return;
    
    // Create style object to store in feature properties
    const styleObject = {
      color,
      lineWidth,
      opacity,
      fillPattern
    };
    
    // Update all selected features with the new style
    const updatedFeatures = features.map(feature => {
      if (selectedFeatures.some(f => f.id === feature.id)) {
        // Create a copy of the feature
        const updatedFeature = { ...feature };
        
        // Create or update properties object with style
        updatedFeature.properties = {
          ...(updatedFeature.properties || {}),
          _style: styleObject
        };
        
        return updatedFeature;
      }
      return feature;
    });
    
    // Update features in context
    setFeatures(updatedFeatures);
  };
  
  // Handle color change
  const handleColorChange = (event: SelectChangeEvent) => {
    setColor(event.target.value);
  };
  
  // Handle line width change
  const handleLineWidthChange = (_event: Event, newValue: number | number[]) => {
    setLineWidth(newValue as number);
  };
  
  // Handle opacity change
  const handleOpacityChange = (_event: Event, newValue: number | number[]) => {
    setOpacity(newValue as number);
  };
  
  // Handle fill pattern change
  const handleFillPatternChange = (event: SelectChangeEvent) => {
    setFillPattern(event.target.value);
  };
  
  if (!hasSelection) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Style Options
        </Typography>
        <Alert severity="info">
          Select features to customize styles.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Style Options
      </Typography>
      
      <Grid container spacing={2}>
        {/* Color Selector */}
        <Grid item xs={12}>
          <FormControl fullWidth size="small">
            <InputLabel id="color-select-label">Color</InputLabel>
            <Select
              labelId="color-select-label"
              id="color-select"
              value={color}
              label="Color"
              onChange={handleColorChange}
            >
              {colorOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        backgroundColor: option.value,
                        marginRight: 1,
                        borderRadius: '2px',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} 
                    />
                    {option.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Line Width Slider (for lines and polygons) */}
        {(isLine || isPolygon) && (
          <Grid item xs={12}>
            <Typography id="line-width-slider" gutterBottom variant="body2">
              Line Width
            </Typography>
            <Slider
              aria-labelledby="line-width-slider"
              value={lineWidth}
              onChange={handleLineWidthChange}
              min={1}
              max={10}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
        )}
        
        {/* Point Size Slider (for points) */}
        {isPoint && (
          <Grid item xs={12}>
            <Typography id="point-size-slider" gutterBottom variant="body2">
              Point Size
            </Typography>
            <Slider
              aria-labelledby="point-size-slider"
              value={lineWidth}
              onChange={handleLineWidthChange}
              min={3}
              max={15}
              step={1}
              marks
              valueLabelDisplay="auto"
            />
          </Grid>
        )}
        
        {/* Fill Pattern (for polygons) */}
        {isPolygon && (
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel id="fill-pattern-label">Fill Pattern</InputLabel>
              <Select
                labelId="fill-pattern-label"
                id="fill-pattern"
                value={fillPattern}
                label="Fill Pattern"
                onChange={handleFillPatternChange}
              >
                <MenuItem value="solid">Solid</MenuItem>
                <MenuItem value="hatch">Hatched</MenuItem>
                <MenuItem value="dots">Dotted</MenuItem>
                <MenuItem value="none">No Fill</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        
        {/* Opacity Slider */}
        <Grid item xs={12}>
          <Typography id="opacity-slider" gutterBottom variant="body2">
            Opacity
          </Typography>
          <Slider
            aria-labelledby="opacity-slider"
            value={opacity}
            onChange={handleOpacityChange}
            min={0}
            max={100}
            step={5}
            marks
            valueLabelDisplay="auto"
            valueLabelFormat={(value: number) => `${value}%`}
          />
        </Grid>
      </Grid>
      
      {/* Apply Style Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={applyStyles}
          fullWidth
          disabled={!hasSelection}
        >
          Apply Style
        </Button>
      </Box>
    </Box>
  );
};

export default StyleOptions;