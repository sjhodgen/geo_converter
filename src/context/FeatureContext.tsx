import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the GeoJSON feature types
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: Record<string, any>;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Define the possible editing modes
export type EditMode = 'normal' | 'simplifying';

// Define types for our feature context
interface FeatureContextType {
  // All loaded features
  features: GeoJSONFeature[];
  setFeatures: (features: GeoJSONFeature[]) => void;
  
  // Currently selected features
  selectedFeatures: GeoJSONFeature[];
  setSelectedFeatures: (features: GeoJSONFeature[]) => void;
  
  // Add a single feature to selection
  selectFeature: (feature: GeoJSONFeature) => void;
  
  // Remove a single feature from selection
  deselectFeature: (feature: GeoJSONFeature) => void;
  
  // Toggle a feature's selection status
  toggleFeatureSelection: (feature: GeoJSONFeature) => void;
  
  // Clear all selections
  clearSelection: () => void;
  
  // Check if a feature is selected
  isFeatureSelected: (feature: GeoJSONFeature) => boolean;
  
  // Preview features (for showing effects without applying)
  previewFeatures: GeoJSONFeature[];
  setPreviewFeatures: (features: GeoJSONFeature[]) => void;
  clearPreviewFeatures: () => void;
  
  // Current editing mode
  editMode: EditMode;
  setEditMode: (mode: EditMode) => void;
  
  // Original imported data
  originalData: GeoJSONCollection | null;
  setOriginalData: (data: GeoJSONCollection | null) => void;
  
  // File name of the imported data
  fileName: string | null;
  setFileName: (name: string | null) => void;
}

// Create the context with default values
const FeatureContext = createContext<FeatureContextType>({
  features: [],
  setFeatures: () => {},
  selectedFeatures: [],
  setSelectedFeatures: () => {},
  selectFeature: () => {},
  deselectFeature: () => {},
  toggleFeatureSelection: () => {},
  clearSelection: () => {},
  isFeatureSelected: () => false,
  previewFeatures: [],
  setPreviewFeatures: () => {},
  clearPreviewFeatures: () => {},
  editMode: 'normal',
  setEditMode: () => {},
  originalData: null,
  setOriginalData: () => {},
  fileName: null,
  setFileName: () => {},
});

// Props for our provider component
interface FeatureContextProviderProps {
  children: ReactNode;
}

// Provider component to wrap around our app
export const FeatureContextProvider: React.FC<FeatureContextProviderProps> = ({ children }) => {
  const [features, setFeatures] = useState<GeoJSONFeature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<GeoJSONFeature[]>([]);
  const [previewFeatures, setPreviewFeatures] = useState<GeoJSONFeature[]>([]);
  const [editMode, setEditMode] = useState<EditMode>('normal');
  const [originalData, setOriginalData] = useState<GeoJSONCollection | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Select a single feature
  const selectFeature = (feature: GeoJSONFeature) => {
    if (!isFeatureSelected(feature)) {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  // Deselect a single feature
  const deselectFeature = (feature: GeoJSONFeature) => {
    setSelectedFeatures(selectedFeatures.filter(f => 
      f.id !== feature.id || 
      JSON.stringify(f.geometry) !== JSON.stringify(feature.geometry)
    ));
  };

  // Toggle feature selection
  const toggleFeatureSelection = (feature: GeoJSONFeature) => {
    if (isFeatureSelected(feature)) {
      deselectFeature(feature);
    } else {
      selectFeature(feature);
    }
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedFeatures([]);
  };

  // Clear all preview features
  const clearPreviewFeatures = () => {
    setPreviewFeatures([]);
  };

  // Check if a feature is selected
  const isFeatureSelected = (feature: GeoJSONFeature) => {
    return selectedFeatures.some(f =>
      f.id === feature.id ||
      JSON.stringify(f.geometry) === JSON.stringify(feature.geometry)
    );
  };

  // Values to provide through the context
  const value = {
    features,
    setFeatures,
    selectedFeatures,
    setSelectedFeatures,
    selectFeature,
    deselectFeature,
    toggleFeatureSelection,
    clearSelection,
    isFeatureSelected,
    previewFeatures,
    setPreviewFeatures,
    clearPreviewFeatures,
    editMode,
    setEditMode,
    originalData,
    setOriginalData,
    fileName,
    setFileName,
  };

  return <FeatureContext.Provider value={value}>{children}</FeatureContext.Provider>;
};

// Custom hook to use the feature context
export const useFeatureContext = () => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureContext must be used within a FeatureContextProvider');
  }
  return context;
};