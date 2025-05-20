import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, TextField } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { InventoryItem, InventoryUnit } from '../types';
import { getAllInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../firebase/services/inventoryService';
// Removed InventoryDashboard import as we're only showing Menu Inventory
import MenuInventoryView from '../components/MenuInventoryView';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatUtils';

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventory-tabpanel-${index}`}
      aria-labelledby={`inventory-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<InventoryItem> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  // We're only showing Menu Inventory tab now
  const [activeTab, setActiveTab] = useState(0);

  // Units for dropdown
  const inventoryUnits: InventoryUnit[] = [
    'piece', 'gram', 'kilogram', 'liter', 'milliliter', 
    'ounce', 'pound', 'cup', 'tablespoon', 'teaspoon'
  ];

  // Load inventory items
  const loadInventoryItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getAllInventoryItems();
      setInventoryItems(items);
    } catch (err) {
      console.error('Error loading inventory items:', err);
      setError('Failed to load inventory items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryItems();
  }, []);

  // Handle dialog open for new item
  const handleAddNew = () => {
    setCurrentItem({
      name: '',
      currentStock: 0,
      unit: 'piece',
      minStockLevel: 0,
      maxStockLevel: 100,
      costPerUnit: 0,
      lastRestockDate: new Date(),
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Handle dialog open for editing
  const handleEdit = (item: InventoryItem) => {
    setCurrentItem(item);
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentItem(null);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Tab panel component
  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`inventory-tabpanel-${index}`}
        aria-labelledby={`inventory-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentItem(prev => prev ? { ...prev, [name]: name.includes('Stock') || name.includes('cost') ? Number(value) : value } : null);
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentItem(prev => prev ? { ...prev, [name]: value } : null);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!currentItem) return;
    setLoading(true); // Activate spinner
    try {
      if (isEditing && currentItem.id) {
        // Update existing item
        await updateInventoryItem(currentItem.id, currentItem as Partial<InventoryItem>);
      } else {
        // Create new item
        await createInventoryItem(currentItem as Omit<InventoryItem, 'id'>);
      }
      
      // Reload inventory items
      await loadInventoryItems(); 
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving inventory item:', err); 
      setError('Failed to save inventory item. Please try again.');
      setLoading(false); 
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      setLoading(true); // Activate spinner
      try {
        await deleteInventoryItem(id);
        await loadInventoryItems(); 
      } catch (err) {
        console.error('Error deleting inventory item:', err);
        setError('Failed to delete inventory item. Please try again.');
        setLoading(false); 
      }
    }
  };

  // Filter inventory items based on search and low stock filter
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !filterLowStock || item.currentStock < item.minStockLevel;
    return matchesSearch && matchesLowStock;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Inventory Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add New Item
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadInventoryItems}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      {/* Only showing Menu Inventory tab */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Menu Inventory
        </Typography>
      </Box>

      {/* Menu Inventory View */}
      <MenuInventoryView />

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid sx={{ gridColumn: 'span 12' }}>
                <TextField
                  fullWidth
                  label="Item Name"
                  name="name"
                  value={currentItem?.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Current Stock"
                  name="currentStock"
                  type="number"
                  value={currentItem?.currentStock || 0}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    name="unit"
                    value={currentItem?.unit || 'piece'}
                    label="Unit"
                    onChange={handleSelectChange}
                  >
                    {inventoryUnits.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Minimum Stock Level"
                  name="minStockLevel"
                  type="number"
                  value={currentItem?.minStockLevel || 0}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Maximum Stock Level"
                  name="maxStockLevel"
                  type="number"
                  value={currentItem?.maxStockLevel || 0}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                <TextField
                  fullWidth
                  label="Cost Per Unit"
                  name="costPerUnit"
                  type="number"
                  value={currentItem?.costPerUnit || 0}
                  onChange={handleInputChange}
                  required
                  InputProps={{
                    startAdornment: <span style={{ marginRight: 8 }}>₹</span>,
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InventoryPage;
