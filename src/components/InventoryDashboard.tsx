import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Button, Chip } from '@mui/material';
import { InventoryItem } from '../types';
import { getAllInventoryItems } from '../firebase/services/inventoryService';

const InventoryDashboard: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInventoryItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getAllInventoryItems();
        setInventoryItems(items);
      } catch (err) {
        console.error('Error loading inventory items:', err);
        setError('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    loadInventoryItems();
  }, []);

  // Calculate inventory statistics
  const stats = {
    totalItems: inventoryItems.length,
    lowStockItems: inventoryItems.filter(item => item.currentStock < item.minStockLevel).length,
    outOfStockItems: inventoryItems.filter(item => item.currentStock === 0).length,
    totalValue: inventoryItems.reduce((total, item) => total + (item.currentStock * item.costPerUnit), 0),
  };

  // Get top 5 low stock items
  const lowStockItems = inventoryItems
    .filter(item => item.currentStock < item.minStockLevel)
    .sort((a, b) => (a.currentStock / a.minStockLevel) - (b.currentStock / b.minStockLevel))
    .slice(0, 5);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Inventory Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: '#f0f7ff',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="primary">
              {stats.totalItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Inventory Items
            </Typography>
          </Paper>
        </Grid>

        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: stats.lowStockItems > 0 ? '#fff4e5' : '#f0f7ff',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              color={stats.lowStockItems > 0 ? 'warning.main' : 'primary'}
            >
              {stats.lowStockItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Low Stock Items
            </Typography>
          </Paper>
        </Grid>

        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: stats.outOfStockItems > 0 ? '#ffeaea' : '#f0f7ff',
              borderRadius: 2
            }}
          >
            <Typography 
              variant="h6" 
              color={stats.outOfStockItems > 0 ? 'error.main' : 'primary'}
            >
              {stats.outOfStockItems}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Out of Stock Items
            </Typography>
          </Paper>
        </Grid>

        <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' } }}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: '#f0f7ff',
              borderRadius: 2
            }}
          >
            <Typography variant="h6" color="primary">
              ${stats.totalValue.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Inventory Value
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'warning.light',
            bgcolor: 'warning.lighter'
          }}
        >
          <Typography variant="h6" color="warning.dark" gutterBottom>
            Low Stock Alert
          </Typography>
          
          <Grid container spacing={2}>
            {lowStockItems.map((item) => (
              <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }} key={item.id}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    bgcolor: item.currentStock === 0 ? '#ffeaea' : 'white'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1">
                      {item.name}
                    </Typography>
                    {item.currentStock === 0 ? (
                      <Chip size="small" label="Out of Stock" color="error" />
                    ) : (
                      <Chip size="small" label="Low Stock" color="warning" />
                    )}
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Current: {item.currentStock} {item.unit}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Min: {item.minStockLevel} {item.unit}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="contained" 
              color="warning" 
              size="small"
              href="/inventory"
            >
              Manage Inventory
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default InventoryDashboard;
