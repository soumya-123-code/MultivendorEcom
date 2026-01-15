import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  alpha,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: number;
}

export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 500,
}: DetailDrawerProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: width },
          maxWidth: '100%',
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'white',
              backgroundColor: alpha('#fff', 0.1),
              '&:hover': { backgroundColor: alpha('#fff', 0.2) },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>{children}</Box>
    </Drawer>
  );
}

// Helper component for detail sections
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" fontWeight={600} mb={1.5}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// Helper component for detail items
export function DetailItem({
  label,
  value,
  chip,
}: {
  label: string;
  value: React.ReactNode;
  chip?: boolean;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" py={1}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {chip ? (
        <Chip label={value} size="small" />
      ) : (
        <Typography variant="body2" fontWeight={500}>
          {value || '-'}
        </Typography>
      )}
    </Stack>
  );
}
