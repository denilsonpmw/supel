import { Box, Typography, Card, Button, Alert } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PublicIcon from '@mui/icons-material/Public';

export default function ArpsPage() {
  const arpsUrl = 'https://arps.up.railway.app/';

  const handleOpenArps = () => {
    window.open(arpsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 4 }, pb: 4, mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Sistema ARPS
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acesse o sistema de Análise de Registro de Preços com Conclusão
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        O Sistema ARPS será aberto em uma nova aba do navegador para melhor experiência de uso.
      </Alert>

      <Card 
        sx={{ 
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          minHeight: 400,
          boxShadow: 3,
          textAlign: 'center'
        }}
      >
        <PublicIcon sx={{ fontSize: 80, color: 'primary.main', opacity: 0.8 }} />
        
        <Box>
          <Typography variant="h5" gutterBottom>
            Sistema ARPS Externo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
            Este sistema analisa processos com Registro de Preço (RP) e Conclusão.
            Clique no botão abaixo para abrir o sistema em uma nova aba.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleOpenArps}
          endIcon={<OpenInNewIcon />}
          sx={{ 
            px: 4, 
            py: 1.5,
            fontSize: '1.1rem'
          }}
        >
          Abrir Sistema ARPS
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          URL: {arpsUrl}
        </Typography>
      </Card>
    </Box>
  );
}
