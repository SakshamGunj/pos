import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControlLabel, Switch, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { InventoryItem, InventoryUsage, InventoryUnit } from '../types';
import { getAllInventoryItems } from '../firebase/services/inventoryService';

interface InventoryTrackingSectionProps {
  hasInventoryTracking: boolean;
  inventoryUsage: InventoryUsage[] | null | undefined;
  onInventoryTrackingChange: (hasTracking: boolean) => void;
  onInventoryUsageChange: (usage: InventoryUsage[]) => void;
  inventoryAvailable?: boolean;
  onInventoryAvailableChange?: (available: boolean) => void;
  inventoryUnit?: InventoryUnit;
  onInventoryUnitChange?: (unit: InventoryUnit) => void;
  startingInventory?: number;
  onStartingInventoryChange?: (quantity: number) => void;
  decrementCounter?: number;
  onDecrementCounterChange?: (counter: number) => void;
}

const InventoryTrackingSection: React.FC<InventoryTrackingSectionProps> = ({
  hasInventoryTracking,
  inventoryUsage,
  onInventoryTrackingChange,
  onInventoryUsageChange,
  inventoryAvailable = true,
  onInventoryAvailableChange = () => {},
  inventoryUnit = 'piece',
  onInventoryUnitChange = () => {},
  startingInventory = 0,
  onStartingInventoryChange = () => {},
  decrementCounter = 1,
  onDecrementCounterChange = () => {}
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUsage, setCurrentUsage] = useState<Partial<InventoryUsage> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Load inventory items
  useEffect(() => {
    const loadInventoryItems = async () => {
      setLoading(true);
      try {
        const items = await getAllInventoryItems();
        setInventoryItems(items);
      } catch (err) {
        console.error('Error loading inventory items:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInventoryItems();
  }, []);

  // Handle adding new inventory usage
  const handleAddUsage = () => {
    setCurrentUsage({
      inventoryItemId: '',
      quantityUsedPerMenuItem: 1
    });
    setEditingIndex(null);
    setOpenDialog(true);
  };

  // Handle editing existing inventory usage
  const handleEditUsage = (usage: InventoryUsage, index: number) => {
    setCurrentUsage(usage);
    setEditingIndex(index);
    setOpenDialog(true);
  };

  // Handle removing inventory usage
  const handleRemoveUsage = (index: number) => {
    const updatedUsage = [...(inventoryUsage || [])];
    updatedUsage.splice(index, 1);
    onInventoryUsageChange(updatedUsage);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUsage(null);
    setEditingIndex(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentUsage(prev => prev ? { ...prev, [name]: name === 'quantityUsedPerMenuItem' ? Number(value) : value } : null);
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentUsage(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle save inventory usage
  const handleSaveUsage = () => {
    if (!currentUsage || !currentUsage.inventoryItemId || !currentUsage.quantityUsedPerMenuItem) {
      return;
    }

    const updatedUsage = [...(inventoryUsage || [])];
    
    if (editingIndex !== null) {
      // Update existing usage
      updatedUsage[editingIndex] = currentUsage as InventoryUsage;
    } else {
      // Add new usage
      updatedUsage.push(currentUsage as InventoryUsage);
    }

    onInventoryUsageChange(updatedUsage);
    handleCloseDialog();
  };

  // Get inventory item name by ID
  const getInventoryItemName = (id: string): string => {
    const item = inventoryItems.find(item => item.id === id);
    return item ? item.name : 'Unknown Item';
  };

  // Get inventory item unit by ID
  const getInventoryItemUnit = (id: string): string => {
    const item = inventoryItems.find(item => item.id === id);
    return item ? item.unit : '';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Inventory Tracking
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={hasInventoryTracking}
            onChange={(e) => onInventoryTrackingChange(e.target.checked)}
            color="primary"
          />
        }
        label="Track inventory for this menu item"
      />
      
      {hasInventoryTracking && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 40%', minWidth: '200px' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={inventoryAvailable}
                      onChange={(e) => onInventoryAvailableChange(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Item is available in inventory"
                />
              </Box>
              <Box sx={{ flex: '1 1 40%', minWidth: '200px' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Default Unit</InputLabel>
                  <Select
                    value={inventoryUnit}
                    label="Default Unit"
                    onChange={(e) => onInventoryUnitChange(e.target.value as InventoryUnit)}
                  >
                    <MenuItem value="piece">Pieces</MenuItem>
                    <MenuItem value="gram">Grams</MenuItem>
                    <MenuItem value="kilogram">Kilograms</MenuItem>
                    <MenuItem value="liter">Liters</MenuItem>
                    <MenuItem value="milliliter">Milliliters</MenuItem>
                    <MenuItem value="ounce">Ounces</MenuItem>
                    <MenuItem value="pound">Pounds</MenuItem>
                    <MenuItem value="cup">Cups</MenuItem>
                    <MenuItem value="tablespoon">Tablespoons</MenuItem>
                    <MenuItem value="teaspoon">Teaspoons</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 40%', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Starting Inventory Quantity"
                  type="number"
                  value={startingInventory}
                  onChange={(e) => onStartingInventoryChange(Number(e.target.value))}
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Box>
              <Box sx={{ flex: '1 1 40%', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Decrement Per Order"
                  type="number"
                  value={decrementCounter}
                  onChange={(e) => onDecrementCounterChange(Number(e.target.value))}
                  size="small"
                  InputProps={{ inputProps: { min: 0.01, step: 0.01 } }}
                  helperText={`Units to subtract from inventory per order`}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {hasInventoryTracking && (
        <Box sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1">
              Inventory Items Used
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddUsage}
              disabled={loading || inventoryItems.length === 0}
            >
              Add Inventory Item
            </Button>
          </Box>

          {loading ? (
            <Typography>Loading inventory items...</Typography>
          ) : inventoryItems.length === 0 ? (
            <Typography color="error">
              No inventory items available. Please add inventory items first.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Inventory Item</TableCell>
                    <TableCell align="right">Quantity Used Per Menu Item</TableCell>
                    <TableCell align="right">Unit</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryUsage && inventoryUsage.length > 0 ? (
                    inventoryUsage.map((usage, index) => (
                      <TableRow key={index}>
                        <TableCell>{getInventoryItemName(usage.inventoryItemId)}</TableCell>
                        <TableCell align="right">{usage.quantityUsedPerMenuItem}</TableCell>
                        <TableCell align="right">{getInventoryItemUnit(usage.inventoryItemId)}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUsage(usage, index)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleRemoveUsage(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No inventory items added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Add/Edit Inventory Usage Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Inventory Usage' : 'Add Inventory Usage'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth>
                  <InputLabel>Inventory Item</InputLabel>
                  <Select
                    name="inventoryItemId"
                    value={currentUsage?.inventoryItemId || ''}
                    label="Inventory Item"
                    onChange={handleSelectChange}
                    required
                  >
                    {inventoryItems.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name} ({item.currentStock} {item.unit} available)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Quantity Used Per Menu Item"
                  name="quantityUsedPerMenuItem"
                  type="number"
                  value={currentUsage?.quantityUsedPerMenuItem || 1}
                  onChange={handleInputChange}
                  required
                  inputProps={{ min: 0.01, step: 0.01 }}
                  helperText={currentUsage?.inventoryItemId ? 
                    `Unit: ${getInventoryItemUnit(currentUsage.inventoryItemId)}` : ''}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveUsage} 
            variant="contained" 
            color="primary"
            disabled={!currentUsage?.inventoryItemId || !currentUsage?.quantityUsedPerMenuItem}
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryTrackingSection;
