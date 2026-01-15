import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  IconButton,
  Alert,
  Card,
  CardContent,
  Divider,
  TextField,
  Avatar,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCartCheckout,
  ShoppingCart,
} from '@mui/icons-material';
import { cartAPI } from '../utils/api';
import { PageHeader, ConfirmDialog } from '../components';

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      setCart(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    try {
      await cartAPI.updateItem(itemId, quantity);
      loadCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await cartAPI.removeItem(itemId);
      loadCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartAPI.clear();
      setClearDialogOpen(false);
      loadCart();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum: number, item: any) => sum + (item.price || item.product?.selling_price || 0) * item.quantity,
    0
  );
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <Box>
      <PageHeader
        title="Shopping Cart"
        subtitle={`${items.length} item(s) in your cart`}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {items.length === 0 && !loading ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <ShoppingCart sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" mb={1}>
            Your cart is empty
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Add some products to get started
          </Typography>
          <Button variant="contained" href="/products">
            Browse Products
          </Button>
        </Paper>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Cart Items */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={600}>Cart Items</Typography>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setClearDialogOpen(true)}
                    disabled={items.length === 0}
                  >
                    Clear All
                  </Button>
                </Stack>
              </Box>
              <Box sx={{ p: 2 }}>
                {items.map((item: any, index: number) => (
                  <Box key={item.id}>
                    <Stack direction="row" spacing={2} alignItems="center" py={2}>
                      <Avatar
                        variant="rounded"
                        src={item.product?.image || item.image}
                        sx={{ width: 80, height: 80, bgcolor: '#f1f5f9' }}
                      >
                        {item.product?.name?.[0] || 'P'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600}>
                          {item.product?.name || item.product_name}
                        </Typography>
                        {item.variant && (
                          <Typography variant="caption" color="text.secondary">
                            Variant: {item.variant.name}
                          </Typography>
                        )}
                        <Typography color="primary" fontWeight={600} mt={0.5}>
                          ₹{item.price || item.product?.selling_price}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <TextField
                          size="small"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                          }
                          sx={{ width: 60 }}
                          inputProps={{ style: { textAlign: 'center' } }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Typography fontWeight={600} sx={{ minWidth: 80, textAlign: 'right' }}>
                        ₹{((item.price || item.product?.selling_price || 0) * item.quantity).toLocaleString()}
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                    {index < items.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Order Summary */}
          <Box sx={{ width: { xs: '100%', md: 360 } }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={3}>
                  Order Summary
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight={500}>₹{subtotal.toLocaleString()}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Tax (18% GST)</Typography>
                    <Typography fontWeight={500}>₹{tax.toLocaleString()}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Shipping</Typography>
                    <Typography fontWeight={500} color="success.main">
                      Free
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹{total.toLocaleString()}
                    </Typography>
                  </Stack>
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<ShoppingCartCheckout />}
                  sx={{ mt: 3 }}
                  disabled={items.length === 0}
                  href="/checkout"
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Stack>
      )}

      <ConfirmDialog
        open={clearDialogOpen}
        title="Clear Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
        onConfirm={handleClearCart}
        onCancel={() => setClearDialogOpen(false)}
      />
    </Box>
  );
}
