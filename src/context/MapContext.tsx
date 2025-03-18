import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LatLngBounds, LatLngTuple } from 'leaflet';

// Define types for our map context
interface MapContextType {
  center: LatLngTuple;
  setCenter: (center: LatLngTuple) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  bounds: LatLngBounds | null;
  setBounds: (bounds: LatLngBounds | null) => void;
  baseMapType: string;
  setBaseMapType: (type: string) => void;
  isSelecting: boolean;
  setIsSelecting: (isSelecting: boolean) => void;
  selectionMode: 'rectangle' | 'lasso' | 'click' | null;
  setSelectionMode: (mode: 'rectangle' | 'lasso' | 'click' | null) => void;
}

// Create the context with default values
const MapContext = createContext<MapContextType>({
  center: [0, 0],
  setCenter: () => {},
  zoom: 2,
  setZoom: () => {},
  bounds: null,
  setBounds: () => {},
  baseMapType: 'streets',
  setBaseMapType: () => {},
  isSelecting: false,
  setIsSelecting: () => {},
  selectionMode: null,
  setSelectionMode: () => {},
});

// Props for our provider component
interface MapContextProviderProps {
  children: ReactNode;
}

// Provider component to wrap around our app
export const MapContextProvider: React.FC<MapContextProviderProps> = ({ children }) => {
  const [center, setCenter] = useState<LatLngTuple>([0, 0]);
  const [zoom, setZoom] = useState(2);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [baseMapType, setBaseMapType] = useState('streets');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'rectangle' | 'lasso' | 'click' | null>(null);

  // Values to provide through the context
  const value = {
    center,
    setCenter,
    zoom,
    setZoom,
    bounds,
    setBounds,
    baseMapType,
    setBaseMapType,
    isSelecting,
    setIsSelecting,
    selectionMode,
    setSelectionMode,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

// Custom hook to use the map context
export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapContextProvider');
  }
  return context;
};