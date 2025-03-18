import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useFeatureContext } from '../../../context/FeatureContext';
import { useAppContext } from '../../../context/AppContext';

interface PropertyRow {
  name: string;
  value: string | number | boolean | null;
  mixed: boolean;
}

const PropertyTable: React.FC = () => {
  const { selectedFeatures, setFeatures, features } = useFeatureContext();
  const { setError } = useAppContext();
  
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>([]);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Generate the property rows from selected features
  useEffect(() => {
    if (selectedFeatures.length === 0) {
      setPropertyRows([]);
      return;
    }
    
    try {
      const allPropertyNames = new Set<string>();
      
      // Collect all property names from all selected features
      selectedFeatures.forEach(feature => {
        if (feature.properties) {
          Object.keys(feature.properties).forEach(key => {
            allPropertyNames.add(key);
          });
        }
      });
      
      // Create property rows
      const rows: PropertyRow[] = Array.from(allPropertyNames).map(name => {
        // Get all values for this property across selected features
        const values = selectedFeatures.map(feature => 
          feature.properties && feature.properties[name] !== undefined
            ? feature.properties[name]
            : null
        );
        
        // Check if all values are the same
        const firstValue = values[0];
        const allSame = values.every(val => 
          (val === null && firstValue === null) || 
          (val !== null && firstValue !== null && val === firstValue)
        );
        
        return {
          name,
          value: allSame ? firstValue : null,
          mixed: !allSame
        };
      });
      
      // Sort rows alphabetically by property name
      rows.sort((a, b) => a.name.localeCompare(b.name));
      
      setPropertyRows(rows);
    } catch (error) {
      setError(`Error loading properties: ${(error as Error).message}`);
    }
  }, [selectedFeatures, setError]);
  
  // Start editing a property
  const handleEdit = (propertyName: string, currentValue: any) => {
    setEditingRow(propertyName);
    setEditValue(currentValue !== null ? String(currentValue) : '');
  };
  
  // Cancel editing
  const handleCancel = () => {
    setEditingRow(null);
    setEditValue('');
  };
  
  // Save edited property
  const handleSave = (propertyName: string) => {
    try {
      // Update all selected features with the new property value
      const updatedFeatures = features.map(feature => {
        if (selectedFeatures.some(f => f.id === feature.id)) {
          // Create a copy of the feature
          const updatedFeature = { ...feature };
          
          // Create or update properties object
          updatedFeature.properties = { 
            ...(updatedFeature.properties || {}),
            [propertyName]: editValue 
          };
          
          return updatedFeature;
        }
        return feature;
      });
      
      // Update features in context
      setFeatures(updatedFeatures);
      
      // Exit edit mode
      setEditingRow(null);
      setEditValue('');
    } catch (error) {
      setError(`Error updating property: ${(error as Error).message}`);
    }
  };
  
  if (selectedFeatures.length === 0) {
    return null;
  }
  
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, maxHeight: '300px' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Property</TableCell>
            <TableCell>Value</TableCell>
            <TableCell align="center" sx={{ width: '80px' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {propertyRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                <Typography variant="body2" color="text.secondary">
                  No properties available
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            propertyRows.map(row => (
              <TableRow key={row.name}>
                <TableCell component="th" scope="row">
                  <Typography variant="body2">{row.name}</Typography>
                </TableCell>
                <TableCell>
                  {editingRow === row.name ? (
                    <TextField
                      size="small"
                      fullWidth
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      variant="outlined"
                      margin="dense"
                    />
                  ) : (
                    <Box>
                      {row.mixed ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          (Multiple values)
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          {row.value === null ? '(empty)' : String(row.value)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </TableCell>
                <TableCell align="center">
                  {editingRow === row.name ? (
                    <Box>
                      <Tooltip title="Save">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleSave(row.name)}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton 
                          size="small" 
                          color="default"
                          onClick={handleCancel}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="Edit value">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(row.name, row.value)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PropertyTable;