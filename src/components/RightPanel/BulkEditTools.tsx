import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  Chip,
  Alert,
  Tooltip,
  Slider,
  FormControl,
  InputLabel,
  FormHelperText,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import CompressIcon from '@mui/icons-material/Compress';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useFeatureContext, GeoJSONFeature } from '../../context/FeatureContext';
import { useAppContext } from '../../context/AppContext';
import { simplifyFeature } from '../../utils/simplify';
import { countTotalPoints } from '../../utils/geometryUtils';

const BulkEditTools: React.FC = () => {
  const {
    selectedFeatures,
    features,
    setFeatures,
    setSelectedFeatures,
    clearSelection,
    previewFeatures,
    setPreviewFeatures,
    clearPreviewFeatures,
    editMode,
    setEditMode
  } = useFeatureContext();
  const { setError } = useAppContext();
  
  // State for simplification tool
  const [simplifyTolerance, setSimplifyTolerance] = useState<number>(0.001);
  const [isSliding, setIsSliding] = useState(false);
  const [previewDirty, setPreviewDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToleranceRef = useRef<number>(simplifyTolerance);
  const hasSelection = selectedFeatures.length > 0;
  const isSimplifying = editMode === 'simplifying';
  
  // Calculate the total points in selected features
  const originalPointCount = useMemo(() => {
    return countTotalPoints(selectedFeatures);
  }, [selectedFeatures]);
  
  // Calculate the total points in preview (simplified) features
  const previewPointCount = useMemo(() => {
    return countTotalPoints(previewFeatures);
  }, [previewFeatures]);
  
  // Calculate percentage reduction
  const pointReduction = useMemo(() => {
    if (originalPointCount === 0) return 0;
    return Math.round((1 - (previewPointCount / originalPointCount)) * 100);
  }, [originalPointCount, previewPointCount]);
  
  // Function to generate preview - with optimized performance
  const generatePreview = useCallback(() => {
    if (!hasSelection || editMode !== 'simplifying') return;
    
    // Skip regenerating if we're actively sliding and already have previews
    if (isSliding && previewFeatures.length > 0 && !previewDirty) return;
    
    try {
      // Create simplified versions of the selected features
      const simplified = selectedFeatures
        .filter(feature =>
          feature.geometry.type !== 'MultiPoint' &&
          ['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'].includes(feature.geometry.type))
        .map(feature => {
          const simplifiedFeature = simplifyFeature(feature, lastToleranceRef.current);
          if (!simplifiedFeature.properties) {
            simplifiedFeature.properties = {};
          }
          simplifiedFeature.properties._isPreview = true;
          return simplifiedFeature;
        });
      
      // Only log when not sliding to reduce console spam
      if (!isSliding) {
        console.log('Preview updated:', simplified.length, 'Original points:', originalPointCount, 'Preview points:', countTotalPoints(simplified));
      }
      
      // Set the preview features and mark as clean
      setPreviewFeatures(simplified);
      setPreviewDirty(false);
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  }, [hasSelection, editMode, selectedFeatures, originalPointCount, setPreviewFeatures, isSliding, previewFeatures, previewDirty]);
  
  // Update tolerance with more effective throttling
  const updateTolerance = useCallback((newValue: number) => {
    // Only mark preview as dirty if the tolerance actually changed
    if (newValue !== simplifyTolerance) {
      setPreviewDirty(true);
    }
    
    // Always update the visible tolerance value immediately for responsive UI
    setSimplifyTolerance(newValue);
    lastToleranceRef.current = newValue;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a new timeout with longer delay to reduce processing frequency
    timeoutRef.current = setTimeout(() => {
      if (editMode === 'simplifying' && previewDirty) {
        generatePreview();
      }
      setIsSliding(false);
    }, 750); // Increased debounce time for better performance
  }, [editMode, generatePreview, simplifyTolerance, previewDirty]);
  
  // Clear previews when exiting simplify mode or changing selection
  useEffect(() => {
    if (editMode !== 'simplifying') {
      clearPreviewFeatures();
    }
  }, [editMode, clearPreviewFeatures]);
  
  // Generate previews when entering simplify mode or changing selection while in simplify mode
  useEffect(() => {
    if (editMode === 'simplifying') {
      // Mark as dirty when first entering simplify mode
      if (!isSimplifying) {
        setPreviewDirty(true);
      }
      generatePreview();
    } else {
      clearPreviewFeatures();
    }
  }, [editMode, selectedFeatures, generatePreview, clearPreviewFeatures, isSimplifying]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearPreviewFeatures();
    };
  }, [clearPreviewFeatures]);
  
  // Enter simplification mode
  const enterSimplifyMode = () => {
    setEditMode('simplifying');
  };
  
  // Exit simplification mode
  const exitSimplifyMode = () => {
    setEditMode('normal');
    clearPreviewFeatures();
  };
  
  // Select all features
  const handleSelectAll = () => {
    setSelectedFeatures([...features]);
  };
  
  // Clear selection
  const handleClearSelection = () => {
    clearSelection();
  };
  
  // Delete selected features
  const handleDeleteSelected = () => {
    if (!hasSelection) return;
    
    try {
      // Filter out selected features
      const selectedIds = selectedFeatures.map(f => f.id);
      const remainingFeatures = features.filter(f => !selectedIds.includes(f.id));
      
      // Update features
      setFeatures(remainingFeatures);
      
      // Clear selection
      clearSelection();
    } catch (error) {
      setError(`Error deleting features: ${(error as Error).message}`);
    }
  };
  
  // This functionality has been removed as features are now automatically flattened on import

  // Simplify selected features (Apply the changes)
  const handleSimplifyFeatures = () => {
    if (!hasSelection) return;
    
    try {
      // Create an array to hold the updated features
      const updatedFeatures = [...features];
      
      // Track which features were simplified for selection update
      const simplifiedFeatures: GeoJSONFeature[] = [];
      
      // Count simplified features
      let simplifiedCount = 0;
      let unchangedCount = 0;
      
      // Apply simplification to each selected feature
      selectedFeatures.forEach(feature => {
        // Skip MultiPoint features
        if (feature.geometry.type === 'MultiPoint') {
          simplifiedFeatures.push(feature); // Keep in selection
          unchangedCount++;
          return;
        }
        
        // Only simplify LineString and Polygon features
        if (['LineString', 'Polygon', 'MultiLineString', 'MultiPolygon'].includes(feature.geometry.type)) {
          // Find the feature in the array and replace it with simplified version
          const index = updatedFeatures.findIndex(f => f.id === feature.id);
          if (index !== -1) {
            const simplifiedFeature = simplifyFeature(feature, simplifyTolerance);
            updatedFeatures[index] = simplifiedFeature;
            simplifiedFeatures.push(simplifiedFeature); // Add to new selection
            simplifiedCount++;
          }
        } else {
          simplifiedFeatures.push(feature); // Keep in selection
          unchangedCount++;
        }
      });
      
      // Update features in context
      setFeatures(updatedFeatures);
      
      // Update selection to use the simplified features
      setSelectedFeatures(simplifiedFeatures);
      
      // Exit simplification mode
      exitSimplifyMode();
      
      // Log what happened
      console.log(`Simplified ${simplifiedCount} features, ${unchangedCount} features were unchanged.`);
      
    } catch (error) {
      setError(`Error simplifying features: ${(error as Error).message}`);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Operations
      </Typography>
      
      {!hasSelection ? (
        <Alert severity="info">
          Select features to enable bulk operations.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${selectedFeatures.length} feature${selectedFeatures.length !== 1 ? 's' : ''} selected`}
              color="primary"
              sx={{ mr: 1, mb: 1 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              onClick={handleClearSelection}
            >
              Clear Selection
            </Button>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Simplify feature */}
            {isSimplifying ? (
              // Simplification Mode UI
              <Card variant="outlined" sx={{ mb: 2, mt: 1, borderColor: 'primary.main' }}>
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Simplification Mode
                  </Typography>
                
                  {/* Point count information */}
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Original: <strong>{originalPointCount}</strong>
                    </Typography>
                    <Typography variant="body2" color={pointReduction > 0 ? "success.main" : "text.secondary"}>
                      After: <strong>{previewPointCount}</strong> <span style={{fontWeight: 'bold'}}>(-{pointReduction}%)</span>
                    </Typography>
                  </Box>
                  
                  {/* Tolerance slider */}
                  <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
                    <InputLabel id="simplify-tolerance-label" shrink>
                      Simplification Tolerance
                    </InputLabel>
                    <Box sx={{ mt: 3, px: 1 }}>
                      <Slider
                        aria-labelledby="simplify-tolerance-label"
                        value={simplifyTolerance}
                      onChange={(_, newValue) => {
                        // Mark that we're sliding and update tolerance with debounce
                        if (!isSliding) setIsSliding(true);
                        // Only update the tolerance if it's actually changed
                        const toleranceValue = newValue as number;
                        if (toleranceValue !== simplifyTolerance) {
                          updateTolerance(toleranceValue);
                        }
                      }}
                        step={0.0001}
                        min={0.0001}
                        max={0.01}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => value.toFixed(4)}
                        // Slider remains enabled to allow continuous interaction
                      />
                    </Box>
                    <FormHelperText>
                      Higher values = more simplification
                    </FormHelperText>
                  </FormControl>
                  
                  {/* Action buttons */}
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckIcon />}
                      onClick={handleSimplifyFeatures}
                      sx={{ flex: 1 }}
                      size="small"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<CloseIcon />}
                      onClick={exitSimplifyMode}
                      sx={{ flex: 1 }}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              // Normal Mode UI - Just the enter simplification button
              <Box sx={{ mb: 2, mt: 1 }}>
                <Tooltip title="Simplify selected LineString and Polygon features by removing unnecessary points">
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<CompressIcon />}
                    onClick={enterSimplifyMode}
                    fullWidth
                    size="small"
                    sx={{ mt: 1 }}
                    disabled={!hasSelection}
                  >
                    Simplify Geometry
                  </Button>
                </Tooltip>
              </Box>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            {/* Delete selected features button */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteSelected}
              fullWidth
              size="small"
            >
              Delete Selected
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default BulkEditTools;