import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import AnalyticsDashboard from '../../components/AnalyticsDashboard';
// import { usePageAnalytics } from '../../hooks/useAnalytics';

const AnalyticsPage: React.FC = () => {
  // usePageAnalytics('Analytics Dashboard', 'admin');

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics & Métricas
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Análise comportamental dos usuários e métricas de uso do sistema
        </Typography>
      </Box>
      
      <AnalyticsDashboard />
    </Container>
  );
};

export default AnalyticsPage;
