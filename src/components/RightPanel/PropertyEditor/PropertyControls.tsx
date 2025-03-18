import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useFeatureContext } from '../../../context/FeatureContext';
import { useAppContext } from '../../../context/AppContext';

const PropertyControls: React.FC = () => {
  const { selectedFeatures, setFeatures, features } = useFeatureContext();
  const { setError } = useAppContext();
  
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyValue, setNewPropertyValue] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState('');
  
  const hasSelection = selectedFeatures.length > 0;
  
  // Open add property dialog
  const handleOpenAddDialog = () => {
    setNewPropertyName('');
    setNewPropertyValue('');
    setOpenAddDialog(true);
  };
  
  // Close add property dialog
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  // Add a new property to all selected features
  const handleAddProperty = () => {
    if (!newPropertyName.trim()) {
      setError('Property name cannot be empty');
      return;
    }
    
    try {
      // Update all selected features with the new property
      const updatedFeatures = features.map(feature => {
        if (selectedFeatures.some(f => f.id === feature.id)) {
          // Create a copy of the feature
          const updatedFeature = { ...feature };
          
          // Create or update properties object
          updatedFeature.properties = { 
            ...(updatedFeature.properties || {}),
            [newPropertyName.trim()]: newPropertyValue 
          };
          
          return updatedFeature;
        }
        return feature;
      });
      
      // Update features in context
      setFeatures(updatedFeatures);
      
      // Close dialog
      setOpenAddDialog(false);
    } catch (error) {
      setError(`Error adding property: ${(error as Error).message}`);
    }
  };
  
  // Close delete property dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Delete a property from all selected features
  const handleDeleteProperty = () => {
    try {
      // Update all selected features by removing the property
      const updatedFeatures = features.map(feature => {
        if (selectedFeatures.some(f => f.id === feature.id) && feature.properties) {
          // Create a copy of the feature
          const updatedFeature = { ...feature };
          
          // Create a copy of properties without the deleted property
          const newProperties = { ...updatedFeature.properties };
          delete newProperties[propertyToDelete];
          
          updatedFeature.properties = newProperties;
          return updatedFeature;
        }
        return feature;
      });
      
      // Update features in context
      setFeatures(updatedFeatures);
      
      // Close dialog
      setOpenDeleteDialog(false);
    } catch (error) {
      setError(`Error deleting property: ${(error as Error).message}`);
    }
  };
  
  // If no features are selected, don't render controls
  if (!hasSelection) {
    return null;
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={1}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          fullWidth
          size="small"
        >
          Add Property
        </Button>
      </Stack>
      
      {/* Add Property Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Property</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Property Name"
            fullWidth
            value={newPropertyName}
            onChange={(e) => setNewPropertyName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Property Value"
            fullWidth
            value={newPropertyValue}
            onChange={(e) => setNewPropertyValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddProperty} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Property Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Property</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the property "{propertyToDelete}" from all selected features?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteProperty} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyControls;