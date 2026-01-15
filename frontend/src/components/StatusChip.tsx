import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

const statusColors: Record<string, ChipProps['color']> = {
  // General
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  suspended: 'error',

  // Orders
  confirmed: 'info',
  processing: 'info',
  packed: 'primary',
  ready_for_pickup: 'primary',
  out_for_delivery: 'secondary',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
  returned: 'warning',
  refunded: 'default',

  // Payments
  paid: 'success',
  failed: 'error',
  refund_pending: 'warning',

  // Delivery
  assigned: 'info',
  accepted: 'info',
  picked_up: 'primary',
  in_transit: 'secondary',

  // Purchase Orders
  draft: 'default',
  submitted: 'info',
  sent: 'primary',
  received: 'success',
  partial: 'warning',

  // Inventory
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',

  // Users
  admin: 'error',
  vendor: 'primary',
  customer: 'info',
  delivery_agent: 'secondary',
  warehouse: 'warning',
};

export default function StatusChip({ status, size = 'small' }: StatusChipProps) {
  const color = statusColors[status?.toLowerCase()] || 'default';
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      sx={{
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    />
  );
}
