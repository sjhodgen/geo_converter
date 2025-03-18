import * as shp from 'shpjs';
import JSZip from 'jszip';
import { GeoJSONCollection, GeoJSONFeature } from '../context/FeatureContext';

/**
 * Process a zipped shapefile and convert it to GeoJSON
 * @param file The zipped shapefile
 * @returns A GeoJSON FeatureCollection
 */
export const processShapefile = async (file: File): Promise<GeoJSONCollection> => {
  // Type for shapefile parsing result
  type ShapefileResult = GeoJSONCollection | GeoJSONCollection[];
  
  console.log(`Processing shapefile: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  
  try {
    // Size limit - be more generous but warn for very large files
    if (file.size > 200 * 1024 * 1024) {
      console.warn('Very large file detected: performance may be affected');
    }
    
    // Read the zip file
    console.log('Reading zip file...');
    const zipData = await file.arrayBuffer();
    console.log('ZIP data loaded, size:', zipData.byteLength);
    
    // Load zip contents
    console.log('Parsing zip structure...');
    const zip = await JSZip.loadAsync(zipData);
    
    // Check zip content
    const fileNames = Object.keys(zip.files);
    console.log('Files in ZIP:', fileNames.join(', '));
    
    // Validate that this looks like a shapefile
    const lowerFileNames = fileNames.map(name => name.toLowerCase());
    const hasShp = lowerFileNames.some(name => name.endsWith('.shp'));
    const hasDbf = lowerFileNames.some(name => name.endsWith('.dbf'));
    
    console.log('ZIP validation:', { hasShp, hasDbf });
    
    if (!hasShp && !hasDbf) {
      throw new Error('The ZIP file does not contain required shapefile components (.shp and .dbf files)');
    }
    
    if (!hasShp) {
      throw new Error('Missing .shp file in the ZIP archive');
    }
    
    if (!hasDbf) {
      throw new Error('Missing .dbf file in the ZIP archive');
    }
    
    // Process the shapefile directly using shpjs
    console.log('Starting shapefile parsing...');
    let geojson: ShapefileResult;
    
    // Extract required files from the zip to ensure shpjs can process them correctly
    const extractedFiles: {[key: string]: ArrayBuffer} = {};
    const relevantExtensions = ['.shp', '.dbf', '.prj', '.shx'];
    
    // Find the base name of the shapefile (without extension)
    const shpFile = fileNames.find(name => name.toLowerCase().endsWith('.shp'));
    if (!shpFile) {
      console.error('No .shp file found in ZIP. Files found:', fileNames);
      throw new Error('Could not locate .shp file in the archive');
    }
    
    const baseName = shpFile.slice(0, shpFile.lastIndexOf('.'));
    console.log('Base shapefile name:', baseName);
    
    // Extract all relevant files with the same base name
    for (const fileName of fileNames) {
      const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
      if (relevantExtensions.includes(extension) && fileName.startsWith(baseName)) {
        console.log(`Extracting ${fileName} from ZIP`);
        const fileData = await zip.file(fileName)?.async('arraybuffer');
        if (fileData) {
          extractedFiles[fileName] = fileData;
        }
      }
    }
    
    console.log('Extracted files:', Object.keys(extractedFiles));
    
    if (Object.keys(extractedFiles).length === 0) {
      throw new Error('Could not extract required shapefile components from ZIP');
    }
    
    // Use a simple try-catch for the actual parsing
    try {
      // Use direct method but make sure we have all required files
      geojson = await shp.parseZip(zipData);
      console.log('Shapefile parsed successfully');
      
      // If parsing succeeded but returned null or undefined, throw an error
      if (!geojson) {
        throw new Error('Shapefile parsing returned no data');
      }
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      
      // Try an alternative approach with individual files if direct parsing fails
      try {
        console.log('Attempting alternative parsing method...');
        
        // Find the required files
        const shpFile = fileNames.find(name => name.toLowerCase().endsWith('.shp'));
        const dbfFile = fileNames.find(name => name.toLowerCase().endsWith('.dbf'));
        
        if (!shpFile || !extractedFiles[shpFile]) {
          throw new Error('Could not extract .shp file content');
        }
        
        if (!dbfFile || !extractedFiles[dbfFile]) {
          throw new Error('Could not extract .dbf file content');
        }
        
        console.log('Parsing SHP and DBF files separately');
        
        // Parse SHP for geometry and DBF for attributes
        const geometries = await shp.parseShp(extractedFiles[shpFile]);
        const attributes = await shp.parseDbf(extractedFiles[dbfFile]);
        
        console.log(`Parsed ${geometries.length} geometries and ${attributes.length} attribute records`);
        
        // Combine them into GeoJSON features
        const features = geometries.map((geometry: any, i: number) => {
          return {
            type: "Feature",
            id: `feature-${i}`,
            properties: attributes[i] || {},
            geometry
          };
        });
        
        // Create a GeoJSON collection
        geojson = {
          type: "FeatureCollection",
          features
        };
        
        console.log(`Created GeoJSON with ${features.length} features`);
      } catch (altError) {
        console.error('Alternative parsing failed:', altError);
        
        // More specific error messaging based on the error
        if (parseError instanceof Error) {
          if (parseError.message.includes('Unexpected')) {
            throw new Error('The shapefile appears to be corrupted or in an unsupported format');
          } else {
            throw new Error(`Failed to parse shapefile: ${parseError.message}`);
          }
        } else {
          throw new Error('An unknown error occurred while parsing the shapefile');
        }
      }
    }

    // Ensure we have valid data
    if (!geojson) {
      throw new Error('No data was extracted from the shapefile');
    }
    
    console.log('Processing parsed data structure...');
    
    // Convert to standard FeatureCollection if it's not already
    if (Array.isArray(geojson)) {
      console.log(`Found multiple layers (${geojson.length}) in shapefile`);
      
      // Handle case where multiple layers are in the shapefile
      if (geojson.length === 0) {
        throw new Error('No valid layers found in the shapefile');
      }
      
      // Find the first non-empty layer
      let usableLayer = null;
      for (let i = 0; i < geojson.length; i++) {
        if (geojson[i]?.features?.length > 0) {
          usableLayer = geojson[i];
          console.log(`Using layer ${i} with ${geojson[i].features.length} features`);
          break;
        }
      }
      
      if (!usableLayer) {
        throw new Error('No valid features found in any layer of the shapefile');
      }
      
      // Ensure each feature has a unique ID
      const result: GeoJSONCollection = {
        type: "FeatureCollection",
        features: usableLayer.features.map((feature: any, index: number) => ({
          ...feature,
          id: feature.id || `feature-${index}`
        }))
      };
      
      console.log(`Processed ${result.features.length} features successfully`);
      return result;
    } else {
      // Handle single layer
      if (!geojson.features || !Array.isArray(geojson.features)) {
        console.error('Invalid GeoJSON structure:', geojson);
        throw new Error('The shapefile could not be converted to a valid GeoJSON structure');
      }
      
      console.log(`Processing single layer with ${geojson.features.length} features`);
      
      if (geojson.features.length === 0) {
        throw new Error('The shapefile contains no features');
      }
      
      // Ensure each feature has a unique ID
      const result: GeoJSONCollection = {
        type: "FeatureCollection",
        features: geojson.features.map((feature: any, index: number) => ({
          ...feature,
          id: feature.id || `feature-${index}`
        }))
      };
      
      console.log(`Processed ${result.features.length} features successfully`);
      return result;
    }
  } catch (error) {
    console.error('Error processing shapefile:', error);
    
    // Format error message for user
    let errorMessage = 'Failed to process shapefile.';
    if (error instanceof Error) {
      errorMessage += ' ' + error.message;
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Get feature type (point, line, polygon)
 * @param feature GeoJSON feature
 * @returns The feature type
 */
export const getFeatureType = (feature: any): 'point' | 'line' | 'polygon' | 'other' => {
  if (!feature || !feature.geometry || !feature.geometry.type) {
    return 'other';
  }
  
  const geoType = feature.geometry.type.toLowerCase();
  
  if (geoType.includes('point')) {
    return 'point';
  } else if (geoType.includes('line')) {
    return 'line';
  } else if (geoType.includes('polygon')) {
    return 'polygon';
  } else {
    return 'other';
  }
};

/**
 * Check if a GeoJSON feature has a multi-part geometry
 * @param feature GeoJSON feature
 * @returns Boolean indicating if it's a multi-part feature
 */
export const isMultipartFeature = (feature: GeoJSONFeature): boolean => {
  if (!feature || !feature.geometry || !feature.geometry.type) {
    console.log("isMultipartFeature: Invalid feature structure", feature);
    return false;
  }
  
  const geoType = feature.geometry.type;
  console.log("isMultipartFeature checking geometry type:", geoType);
  
  // Primary check: if type explicitly starts with "Multi"
  if (geoType.startsWith('Multi')) {
    console.log("Detected multi-part feature by type name:", geoType);
    return true;
  }
  
  // Secondary check: examine the coordinates structure
  if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
    return false;
  }
  
  // Different geometries have different coordinate structures
  try {
    const coords = feature.geometry.coordinates;
    
    switch (geoType) {
      case 'Polygon':
        // A polygon with multiple rings (first is outer, rest are holes)
        // We consider this multi-part if it has interior rings (holes)
        if (coords.length > 1) {
          console.log("Detected multi-ring Polygon with holes");
          return true;
        }
        break;
        
      case 'GeometryCollection':
        // A collection of geometries is inherently multi-part
        console.log("Detected GeometryCollection");
        return true;
        
      default:
        // For any other type, examine nesting level of coordinates
        // This is a heuristic approach
        if (coords.length > 1 &&
            Array.isArray(coords[0]) &&
            Array.isArray(coords[0][0])) {
          console.log("Detected potential multi-part structure by coordinate nesting");
          return true;
        }
    }
  } catch (e) {
    console.error("Error examining coordinates:", e);
  }
  
  return false;
};

/**
 * Flatten a multi-part feature into individual features
 * @param feature GeoJSON feature with a multi-part geometry
 * @returns Array of individual features
 */
export const flattenMultipartFeature = (feature: GeoJSONFeature): GeoJSONFeature[] => {
  if (!isMultipartFeature(feature)) {
    return [feature]; // Return original if not multi-part
  }
  
  console.log(`Flattening multi-part feature: ${feature.id}`);
  
  const geoType = feature.geometry.type;
  const coordinates = feature.geometry.coordinates;
  
  // Basic type checking
  if (!Array.isArray(coordinates)) {
    console.warn('Invalid coordinates array in multi-part feature');
    return [feature];
  }
  
  // Create the equivalent single-part geometry type
  let singleType: string;
  switch (geoType) {
    case 'MultiPoint':
      singleType = 'Point';
      break;
    case 'MultiLineString':
      singleType = 'LineString';
      break;
    case 'MultiPolygon':
      singleType = 'Polygon';
      break;
    default:
      console.warn(`Unsupported multi-part geometry type: ${geoType}`);
      return [feature];
  }
  
  // Create individual features for each part
  return coordinates.map((coords, index) => {
    return {
      type: 'Feature',
      id: `${feature.id || 'feature'}-part-${index + 1}`,
      properties: { ...feature.properties, _parentId: feature.id, _partIndex: index },
      geometry: {
        type: singleType,
        coordinates: coords
      }
    };
  });
};

/**
 * Flatten all multi-part features in a GeoJSON collection
 * @param collection GeoJSON feature collection
 * @returns New GeoJSON collection with all features flattened
 */
export const flattenFeatureCollection = (collection: GeoJSONCollection): GeoJSONCollection => {
  console.log('Flattening multi-part features in collection');
  
  if (!collection || !collection.features || !Array.isArray(collection.features)) {
    console.error('Invalid GeoJSON collection provided for flattening');
    return collection;
  }
  
  const flattenedFeatures: GeoJSONFeature[] = [];
  let multipartCount = 0;
  
  // Process each feature
  collection.features.forEach(feature => {
    if (isMultipartFeature(feature)) {
      multipartCount++;
      const parts = flattenMultipartFeature(feature);
      flattenedFeatures.push(...parts);
    } else {
      flattenedFeatures.push(feature);
    }
  });
  
  console.log(`Flattened ${multipartCount} multi-part features into ${flattenedFeatures.length} individual features`);
  
  return {
    type: 'FeatureCollection',
    features: flattenedFeatures
  };
};