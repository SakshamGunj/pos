import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, Grid, Paper, TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Alert, Tabs, Tab, Chip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Refresh as RefreshIcon, Warning as WarningIcon, Dashboard as DashboardIcon, Inventory as InventoryIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import { InventoryItem, InventoryUnit } from '../types';
import { getAllInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../firebase/services/inventoryService';
import InventoryDashboard from '../components/InventoryDashboard';
import MenuInventoryView from '../components/MenuInventoryView';
import LoadingSpinner from '../components/common/LoadingSpinner';

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
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} aria-label="inventory tabs">
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<InventoryIcon />} label="Inventory Items" />
          <Tab icon={<RestaurantIcon />} label="Menu Inventory" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <InventoryDashboard />
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
              <TextField
                fullWidth
                label="Search Inventory"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
              <FormControl fullWidth>
                <InputLabel id="filter-label">Filter</InputLabel>
                <Select
                  labelId="filter-label"
                  value={filterLowStock ? 'low' : 'all'}
                  label="Filter"
                  onChange={(e: SelectChangeEvent) => setFilterLowStock(e.target.value === 'low')}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="low">Low Stock Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <LoadingSpinner text="Loading inventory..." />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Alert severity="info">
            No inventory items found. {searchTerm && 'Try a different search term.'}
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Current Stock</TableCell>
                  <TableCell sx={{ color: 'white' }}>Unit</TableCell>
                  <TableCell sx={{ color: 'white' }}>Min Stock Level</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white' }}>Cost Per Unit</TableCell>
                  <TableCell sx={{ color: 'white' }}>Last Restock</TableCell>
                  <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.currentStock}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.minStockLevel}</TableCell>
                    <TableCell>
                      {item.currentStock === 0 ? (
                        <Chip label="Out of Stock" color="error" size="small" />
                      ) : item.currentStock < item.minStockLevel ? (
                        <Chip label="Low Stock" color="warning" size="small" />
                      ) : (
                        <Chip label="In Stock" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>₹{item.costPerUnit.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(item.lastRestockDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(item)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        <MenuInventoryView />
      </TabPanel>

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
