import { Box, Typography, Alert } from '@mui/material'

function PermissoesPage() {
  return (
    <Box p={3}>
      <Typography variant="h4" component="h1" mb={3}>
        🔐 Permissões
      </Typography>

      <Alert severity="info">
        <Typography variant="h6" gutterBottom>
          🚧 Em Desenvolvimento
        </Typography>
        <Typography variant="body1">
          Página para gerenciamento de permissões e controle de acesso.
        </Typography>
      </Alert>
    </Box>
  )
}

export default PermissoesPage 