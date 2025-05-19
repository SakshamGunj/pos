import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Grid } from '@mui/material';
import { MenuItem } from '../types';
import { getMenuItems } from '../firebase/services/menuService';
import { formatCurrency } from '../utils/formatUtils';

const MenuInventoryView: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    const loadMenuItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getMenuItems();
        // Filter only items with inventory tracking
        const itemsWithInventory = items.filter(item => item.hasInventoryTracking);
        setMenuItems(itemsWithInventory);
      } catch (err) {
        console.error('Error loading menu items with inventory:', err);
        setError('Failed to load menu inventory data');
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  const toggleExpandItem = (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  // Get inventory status color based on current quantity and threshold
  const getInventoryStatusColor = (current: number, min: number) => {
    if (current <= 0) return 'error';
    if (current < min) return 'warning';
    return 'success';
  };

  // Get inventory status text
  const getInventoryStatusText = (current: number, min: number) => {
    if (current <= 0) return 'Out of Stock';
    if (current < min) return 'Low Stock';
    return 'In Stock';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (menuItems.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No menu items with inventory tracking found. Add inventory tracking to menu items to see them here.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Menu Items with Inventory Tracking
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Item Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Category</TableCell>
              <TableCell sx={{ color: 'white' }}>Price</TableCell>
              <TableCell sx={{ color: 'white' }}>Inventory Status</TableCell>
              <TableCell sx={{ color: 'white' }}>Current Stock</TableCell>
              <TableCell sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <TableRow hover>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {item.imageUrl && (
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt={item.name}
                          sx={{ width: 40, height: 40, borderRadius: '4px', mr: 2, objectFit: 'cover' }}
                        />
                      )}
                      <Typography variant="body1">{item.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getInventoryStatusText(item.startingInventoryQuantity || 0, 10)} 
                      color={getInventoryStatusColor(item.startingInventoryQuantity || 0, 10)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.startingInventoryQuantity || 0} {item.inventoryUnit || 'units'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => toggleExpandItem(item.id)}
                    >
                      {expandedItem === item.id ? 'Hide Details' : 'View Details'}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedItem === item.id && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ backgroundColor: 'grey.50' }}>
                      <Box p={2}>
                        <Typography variant="subtitle2" gutterBottom>Inventory Details</Typography>
                        <Grid container spacing={2}>
                          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">Inventory Unit</Typography>
                              <Typography variant="body1">{item.inventoryUnit || 'N/A'}</Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">Decrement Per Order</Typography>
                              <Typography variant="body1">{item.decrementPerOrder || 1} {item.inventoryUnit || 'units'}</Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">Starting Inventory</Typography>
                              <Typography variant="body1">{item.startingInventoryQuantity || 0} {item.inventoryUnit || 'units'}</Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 6' } }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">Current Stock</Typography>
                              <Typography variant="body1">{item.startingInventoryQuantity || 0} {item.inventoryUnit || 'units'}</Typography>
                            </Paper>
                          </Grid>
                          <Grid sx={{ gridColumn: 'span 12' }}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary">Description</Typography>
                              <Typography variant="body1">{item.description || 'No description available'}</Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MenuInventoryView;
