import React from 'react';
import { Box, Typography, Breadcrumbs, Link as MuiLink, SxProps, Theme } from '@mui/material';
import { Link } from 'react-router-dom';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

interface BreadcrumbItem { label: string; path?: string; }
interface PageHeaderProps { title: string; subtitle?: string; breadcrumbs?: BreadcrumbItem[]; actions?: React.ReactNode; sx?: SxProps<Theme>; }

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, actions, sx }) => (
  <Box sx={{ mb: 3, ...sx }}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 1 }}>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return isLast ? (
            <Typography key={index} color="text.primary" variant="body2">{item.label}</Typography>
          ) : (
            <MuiLink key={index} component={Link} to={item.path || '#'} color="inherit" underline="hover" variant="body2">{item.label}</MuiLink>
          );
        })}
      </Breadcrumbs>
    )}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>{title}</Typography>
        {subtitle && <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  </Box>
);

export default PageHeader;
