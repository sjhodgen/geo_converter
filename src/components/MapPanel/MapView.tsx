import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  ZoomControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L, { PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapContext } from '../../context/MapContext';
import { useFeatureContext } from '../../context/FeatureContext';
import { getFeatureType } from '../../services/shapefileService';
import { Box } from '@mui/material';
import { GeoJSONFeature } from '../../context/FeatureContext';

// Fix Leaflet default icon path issues
// This is necessary for the markers to display correctly
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

// Map control component that updates the context when map moves
const MapEventsHandler: React.FC = () => {
  const { setCenter, setZoom, setBounds } = useMapContext();
  const map = useMapEvents({
    moveend: () => {
      setCenter([map.getCenter().lat, map.getCenter().lng]);
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    },
    zoomend: () => {
      setZoom(map.getZoom());
      setBounds(map.getBounds());
    }
  });
  
  return null;
};

// Component to auto-fit bounds to features
const FitBoundsControl: React.FC = () => {
  const { features } = useFeatureContext();
  const map = useMap();
  
  useEffect(() => {
    if (features.length > 0) {
      try {
        // Create a GeoJSON layer to get bounds
        const geoJsonLayer = L.geoJSON(features as any);
        const bounds = geoJsonLayer.getBounds();
        
        // Only fit bounds if they're valid
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
    }
  }, [features, map]);
  
  return null;
};

// Style function for GeoJSON features
const getFeatureStyle = (feature: any, isSelected: boolean, isPreview: boolean = false): PathOptions => {
  if (!feature) return {};
  
  const featureType = getFeatureType(feature);
  const defaultColor = '#3388ff';
  const selectedColor = '#ff4433';
  const previewColor = '#999999'; // Grey color for preview features
  
  // Get custom style if it exists
  const customStyle = feature.properties?._style || {};
  
  // Determine colors - selected state takes precedence over preview
  let color;
  if (isSelected) {
    color = selectedColor;
  } else if (isPreview) {
    color = previewColor;
  } else {
    color = customStyle.color || defaultColor;
  }
  
  // Calculate opacity from percentage
  const opacityValue = customStyle.opacity !== undefined
    ? customStyle.opacity / 100
    : (isSelected ? 0.8 : (isPreview ? 0.7 : 0.6));
  
  // Set fillOpacity based on pattern and opacity
  let fillOpacity;
  if (isSelected) {
    fillOpacity = 0.5;
  } else if (isPreview) {
    fillOpacity = 0.3;
  } else {
    fillOpacity = 0.2;
  }
  
  if (customStyle.opacity !== undefined) {
    if (isSelected) {
      fillOpacity = (customStyle.opacity / 100) * 0.7;
    } else if (isPreview) {
      fillOpacity = (customStyle.opacity / 100) * 0.5;
    } else {
      fillOpacity = (customStyle.opacity / 100) * 0.3;
    }
  }
  
  // Set fill color based on pattern
  let fillColor = color;
  let fillPattern = customStyle.fillPattern || 'solid';
  
  // Determine line width
  let weight;
  if (isSelected) {
    weight = 3;
  } else if (isPreview) {
    weight = 2;
  } else {
    weight = 2;
  }
  
  if (customStyle.lineWidth !== undefined) {
    if (isSelected) {
      weight = customStyle.lineWidth + 1;
    } else if (isPreview) {
      weight = customStyle.lineWidth;
    } else {
      weight = customStyle.lineWidth;
    }
  }
  
  // Build base style
  const baseStyle: PathOptions = {
    color,
    weight,
    opacity: opacityValue,
    fillColor,
    fillOpacity: fillPattern === 'none' ? 0 : fillOpacity,
  };
  
  // Adjust style based on feature type
  switch (featureType) {
    case 'point':
      return {
        ...baseStyle,
        // radius is not a PathOptions property, handled separately in point layers
        weight: isSelected ? 2 : 1,
      };
    case 'line':
      return {
        ...baseStyle,
        weight: customStyle.lineWidth || (isSelected ? 4 : 2),
      };
    case 'polygon':
      return {
        ...baseStyle,
        weight: customStyle.lineWidth || (isSelected ? 3 : 1),
        // Apply different dash patterns based on fill pattern
        dashArray: fillPattern === 'hatch' ? '3, 5' : (fillPattern === 'dots' ? '1, 3' : undefined),
      };
    default:
      return baseStyle;
  }
};

// Main MapView component
const MapView: React.FC = () => {
  const { baseMapType, center, zoom } = useMapContext();
  const {
    features,
    selectedFeatures,
    toggleFeatureSelection,
    isFeatureSelected,
    previewFeatures
  } = useFeatureContext();
  
  // Fix Leaflet icon issue on component mount
  useEffect(() => {
    fixLeafletIcon();
  }, []);
  
  // Get tile layer URL based on the selected base map type
  const getTileLayerUrl = () => {
    switch (baseMapType) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'streets':
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };
  
  // Event handlers for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    layer.on({
      click: () => {
        toggleFeatureSelection(feature);
      }
    });
    
    // Add tooltips for features
    if (feature.properties) {
      const name = 
        feature.properties.name || 
        feature.properties.NAME || 
        feature.id || 
        'Feature';
        
      layer.bindTooltip(name);
    }
  };
  
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={center as [number, number]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getTileLayerUrl()}
        />
        
        <ZoomControl position="bottomright" />
        <MapEventsHandler />
        <FitBoundsControl />
        
        {/* Render the regular features */}
        {features.length > 0 && (
          <GeoJSON
            data={features as any}
            style={(feature) => getFeatureStyle(
              feature,
              feature ? isFeatureSelected(feature as GeoJSONFeature) : false
            )}
            onEachFeature={onEachFeature}
            key={`geojson-${selectedFeatures.length}`} // Force re-render when selection changes
          />
        )}
        
        {/* Render the preview features */}
        {previewFeatures.length > 0 && (
          <GeoJSON
            data={previewFeatures as any}
            style={(feature) => ({
              ...getFeatureStyle(
                feature,
                false, // Not selected
                true   // Preview
              ),
              // Make preview features stand out with distinct styling
              dashArray: '5, 5', // Dashed lines
              zIndex: 1000, // Ensure they're on top
              opacity: 0.8, // Slightly more opaque
              fillOpacity: 0.4 // More visible
            })}
            // Use static key to prevent unnecessary re-renders while tolerance isn't changing
            key="preview-layer"
            // Don't add click handlers to preview features
            onEachFeature={(feature, layer) => {
              if (feature.properties) {
                const name = feature.properties.name || feature.properties.NAME || feature.id || 'Preview';
                layer.bindTooltip(`${name} (Simplified)`);
              }
            }}
          />
        )}
      </MapContainer>
    </Box>
  );
};

export default MapView;