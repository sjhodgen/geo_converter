import { GeoJSONFeature } from '../context/FeatureContext';

// Define types for geometry
type Position = number[];

/**
 * Calculate the perpendicular distance from a point to a line segment
 */
function perpendicularDistance(point: Position, lineStart: Position, lineEnd: Position): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  
  // If the line segment is actually a point, return the distance from the point to the line point
  if (x1 === x2 && y1 === y2) {
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
  }
  
  // Calculate the perpendicular distance
  const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
  
  return numerator / denominator;
}

/**
 * Apply the Ramer-Douglas-Peucker algorithm to simplify a line
 */
function douglasPeucker(points: Position[], tolerance: number): Position[] {
  if (points.length <= 2) {
    return points;
  }
  
  // Find the point with the maximum distance
  let maxDistance = 0;
  let maxIndex = 0;
  
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }
  
  // If the maximum distance is greater than the tolerance, recursively simplify
  if (maxDistance > tolerance) {
    // Recursive call
    const firstHalf = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const secondHalf = douglasPeucker(points.slice(maxIndex), tolerance);
    
    // Concatenate the results, avoiding duplicate points
    return firstHalf.slice(0, -1).concat(secondHalf);
  } else {
    // If max distance is less than tolerance, we can simplify to just the endpoints
    return [firstPoint, lastPoint];
  }
}

/**
 * Simplify a LineString geometry using the Ramer-Douglas-Peucker algorithm
 */
export function simplifyLineString(coordinates: Position[], tolerance: number): Position[] {
  const simplified = douglasPeucker(coordinates, tolerance);
  
  // Ensure we have at least 2 points for a valid LineString
  if (simplified.length < 2) {
    // If we ended up with fewer than 2 points, return the original
    return coordinates;
  }
  
  return simplified;
}

/**
 * Simplify a Polygon geometry using the Ramer-Douglas-Peucker algorithm
 */
export function simplifyPolygon(coordinates: Position[][], tolerance: number): Position[][] {
  // A polygon is an array of rings (the first is the exterior, the rest are holes)
  const simplified = coordinates.map(ring => {
    const simplifiedRing = douglasPeucker(ring, tolerance);
    
    // Ensure we have at least 4 points for a valid polygon ring (first and last are the same)
    if (simplifiedRing.length < 4) {
      return ring; // Return the original ring if too few points
    }
    
    // Ensure the first and last points are the same (closed ring)
    if (
      simplifiedRing[0][0] !== simplifiedRing[simplifiedRing.length - 1][0] || 
      simplifiedRing[0][1] !== simplifiedRing[simplifiedRing.length - 1][1]
    ) {
      simplifiedRing.push([...simplifiedRing[0]]);
    }
    
    return simplifiedRing;
  });
  
  return simplified;
}

/**
 * Simplify a GeoJSON geometry based on its type
 */
export function simplifyGeometry(geometry: GeoJSONFeature['geometry'], tolerance: number): GeoJSONFeature['geometry'] {
  if (!geometry) return geometry;
  
  switch (geometry.type) {
    case 'LineString':
      return {
        type: 'LineString',
        coordinates: simplifyLineString(geometry.coordinates as Position[], tolerance)
      };
    case 'Polygon':
      return {
        type: 'Polygon',
        coordinates: simplifyPolygon(geometry.coordinates as Position[][], tolerance)
      };
    case 'MultiLineString':
      return {
        type: 'MultiLineString',
        coordinates: (geometry.coordinates as Position[][]).map(line => 
          simplifyLineString(line, tolerance)
        )
      };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: (geometry.coordinates as Position[][][]).map(polygon => 
          simplifyPolygon(polygon, tolerance)
        )
      };
    // Don't simplify these types
    case 'Point':
    case 'MultiPoint':
    default:
      return geometry;
  }
}

/**
 * Simplify a GeoJSON feature's geometry
 */
export function simplifyFeature(feature: GeoJSONFeature, tolerance: number): GeoJSONFeature {
  if (!feature || !feature.geometry) return feature;
  
  const simplifiedGeometry = simplifyGeometry(feature.geometry, tolerance);
  
  // Preserve the original ID but add simplification info to properties
  return {
    ...feature,
    // Maintain the same ID to preserve feature identity
    id: feature.id,
    geometry: simplifiedGeometry,
    // Make a deep copy of properties and add simplified flag
    properties: {
      ...(feature.properties ? {...feature.properties} : {}),
      _simplified: true,
      _simplifiedAt: Date.now()
    }
  };
}