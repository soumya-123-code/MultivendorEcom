import React from 'react';
import { Box, Card, CardContent, Typography, SxProps, Theme } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: SvgIconComponent;
  iconColor?: string;
  iconBgColor?: string;
  trend?: { value: number; label?: string; positive?: boolean };
  sx?: SxProps<Theme>;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, iconColor = '#1976d2', iconBgColor = 'rgba(25, 118, 210, 0.1)', trend, sx }) => (
  <Card sx={{ height: '100%', ...sx }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>{title}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>{value}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: trend.positive ? 'success.main' : 'error.main' }}>
                {trend.positive ? '+' : ''}{trend.value}%
              </Typography>
              {trend.label && <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>{trend.label}</Typography>}
            </Box>
          )}
        </Box>
        <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: iconBgColor }}>
          <Icon sx={{ fontSize: 28, color: iconColor }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default StatsCard;
