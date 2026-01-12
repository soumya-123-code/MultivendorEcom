import React from 'react';
import { Chip, ChipProps, alpha } from '@mui/material';
import { statusColors } from '../../theme';
import { snakeToTitle } from '../../utils';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  showLabel?: boolean;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  showLabel = true,
  size = 'small',
  ...props
}) => {
  const color = statusColors[status.toLowerCase()] || '#6b7280';
  const label = showLabel ? snakeToTitle(status) : undefined;

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: alpha(color, 0.15),
        color: color,
        fontWeight: 600,
        fontSize: '0.75rem',
        borderRadius: '6px',
        '& .MuiChip-label': {
          px: 1.5,
        },
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default StatusChip;
