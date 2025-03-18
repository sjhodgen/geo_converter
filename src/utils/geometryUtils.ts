import { GeoJSONFeature } from '../context/FeatureContext';

/**
 * Count the total number of points/vertices in a GeoJSON feature
 */
export function countFeaturePoints(feature: GeoJSONFeature): number {
  if (!feature || !feature.geometry) return 0;
  
  const { type, coordinates } = feature.geometry;
  
  switch (type) {
    case 'Point':
      return 1;
    
    case 'MultiPoint':
      return coordinates.length;
    
    case 'LineString':
      return coordinates.length;
    
    case 'MultiLineString':
      return coordinates.reduce((sum: number, line: any[]) => sum + line.length, 0);
    
    case 'Polygon':
      // Sum up points in all rings (exterior + holes)
      return coordinates.reduce((sum: number, ring: any[]) => sum + ring.length, 0);
    
    case 'MultiPolygon':
      // Sum up points in all polygons
      return coordinates.reduce((sum: number, polygon: any[][]) => {
        // Sum up points in all rings of this polygon
        const polygonPoints = polygon.reduce((ringSum: number, ring: any[]) => 
          ringSum + ring.length, 0);
        return sum + polygonPoints;
      }, 0);
    
    default:
      return 0;
  }
}

/**
 * Count the total number of points in multiple features
 */
export function countTotalPoints(features: GeoJSONFeature[]): number {
  return features.reduce((sum, feature) => sum + countFeaturePoints(feature), 0);
}