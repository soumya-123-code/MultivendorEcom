import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { getStatusColor, statusColors } from '../../theme';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  category: keyof typeof statusColors;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, category, ...props }) => {
  const colors = getStatusColor(category, status);
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Chip
      label={label}
      size="small"
      sx={{ backgroundColor: colors.bg, color: colors.color, fontWeight: 600, fontSize: '0.75rem', ...props.sx }}
      {...props}
    />
  );
};

export default StatusChip;
