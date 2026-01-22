import { Box, Typography, Card, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';

export default function ArpsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sistema ARPS
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acesse o sistema de Análise de Registro de Preços com Conclusão integrado ao Supel
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Erro ao carregar o sistema ARPS. Verifique sua conexão ou tente novamente mais tarde.
        </Alert>
      )}

      <Card 
        sx={{ 
          height: 'calc(100vh - 200px)', 
          position: 'relative', 
          overflow: 'hidden',
          boxShadow: 3
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Carregando sistema ARPS...
            </Typography>
          </Box>
        )}
        <iframe
          src="https://arps.up.railway.app/"
          title="Sistema ARPS - Análise de Registro de Preços"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: loading ? 'none' : 'block'
          }}
          onLoad={handleLoad}
          onError={handleError}
          allow="camera; microphone; geolocation; payment"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />
      </Card>
    </Box>
  );
}
