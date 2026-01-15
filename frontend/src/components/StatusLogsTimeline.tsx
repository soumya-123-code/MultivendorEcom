import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Typography, Box, Paper, Chip } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  LocalShipping,
  Inventory,
  Payment,
} from '@mui/icons-material';

interface StatusLog {
  id: number;
  status: string;
  notes?: string;
  created_at: string;
  created_by_name?: string;
}

interface StatusLogsTimelineProps {
  logs: StatusLog[];
  title?: string;
}

const getStatusIcon = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('deliver')) return <LocalShipping />;
  if (s.includes('cancel') || s.includes('reject') || s.includes('fail')) return <Cancel />;
  if (s.includes('complete') || s.includes('success') || s.includes('approve')) return <CheckCircle />;
  if (s.includes('payment') || s.includes('paid')) return <Payment />;
  if (s.includes('pack') || s.includes('inventory')) return <Inventory />;
  return <Schedule />;
};

const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'grey' => {
  const s = status?.toLowerCase() || '';
  if (s.includes('complete') || s.includes('success') || s.includes('deliver') || s.includes('approve')) return 'success';
  if (s.includes('cancel') || s.includes('reject') || s.includes('fail')) return 'error';
  if (s.includes('pending') || s.includes('wait')) return 'warning';
  if (s.includes('process') || s.includes('transit')) return 'info';
  return 'grey';
};

export default function StatusLogsTimeline({ logs, title }: StatusLogsTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">No status history available</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" fontWeight={600} mb={2}>
          {title}
        </Typography>
      )}
      <Timeline position="right" sx={{ p: 0, m: 0 }}>
        {logs.map((log, index) => (
          <TimelineItem key={log.id}>
            <TimelineOppositeContent sx={{ flex: 0.3, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                {new Date(log.created_at).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {new Date(log.created_at).toLocaleTimeString()}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={getStatusColor(log.status)}>
                {getStatusIcon(log.status)}
              </TimelineDot>
              {index < logs.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ py: 1.5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                }}
              >
                <Chip
                  label={log.status?.replace(/_/g, ' ').toUpperCase()}
                  size="small"
                  color={getStatusColor(log.status)}
                  sx={{ mb: 1, fontWeight: 600 }}
                />
                {log.notes && (
                  <Typography variant="body2" color="text.secondary">
                    {log.notes}
                  </Typography>
                )}
                {log.created_by_name && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    By: {log.created_by_name}
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
