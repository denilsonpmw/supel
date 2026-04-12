import { Typography, Alert } from '@mui/material';
import PageContainer from '../../components/PageContainer';
import PageHeader from '../../components/PageHeader';

function PermissoesPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Permissões" 
        subtitle="Gerenciamento de permissões e controle de acesso" 
      />

      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚧 Em Desenvolvimento
        </Typography>
        <Typography variant="body1">
          Esta página está sendo preparada para permitir o controle granular de acesso às funcionalidades do sistema.
        </Typography>
      </Alert>
    </PageContainer>
  );
}

export default PermissoesPage;