// Common type definitions that can be shared across the application

// Feature types for GIS data
export type FeatureType = 'point' | 'line' | 'polygon' | 'other';

// Style related types
export interface StyleOptions {
  color: string;
  lineWidth: number;
  opacity: number;
  fillPattern?: 'solid' | 'hatch' | 'dots' | 'none';
}