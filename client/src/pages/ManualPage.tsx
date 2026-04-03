import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  MenuBook,
  Download,
  Visibility,
  Security,
  People,
  Assessment,
  Settings,
  Help,
  PhoneAndroid,
  Public,
  CheckCircle,
  Star,
  GpsFixed,
  Business
} from '@mui/icons-material';

const ManualPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            📖 Manual do Usuário - SUPEL
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Sistema Unificado de Processos Eletrônicos de Licitação
          </Typography>
          <Divider sx={{ my: 3 }} />
        </Box>

        {/* Alerta de versão */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>📋 Manual Completo:</strong> A documentação completa está disponível no repositório em <code>docs/manual/MANUAL_USUARIO.md</code>
          </Typography>
        </Alert>

        {/* Visão Geral */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GpsFixed /> Visão Geral
            </Typography>
            <Typography variant="body1" paragraph>
              O SUPEL é um sistema web moderno para gestão de processos licitatórios, desenvolvido como 
              <strong> Progressive Web App (PWA)</strong> que funciona tanto no navegador quanto como aplicativo instalado.
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>⭐ Principais Funcionalidades:</Typography>
            <List>
              <ListItem>
                <ListItemIcon><Assessment /></ListItemIcon>
                <ListItemText primary="Dashboard com métricas em tempo real" />
              </ListItem>
              <ListItem>
                <ListItemIcon><PhoneAndroid /></ListItemIcon>
                <ListItemText primary="PWA - Funciona online e offline" />
              </ListItem>
              <ListItem>
                <ListItemIcon><People /></ListItemIcon>
                <ListItemText primary="Multi-usuário com diferentes níveis de acesso" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle /></ListItemIcon>
                <ListItemText primary="Gestão completa de processos licitatórios" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Download /></ListItemIcon>
                <ListItemText primary="Relatórios detalhados e exportáveis" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Security /></ListItemIcon>
                <ListItemText primary="Segurança com autenticação robusta" />
              </ListItem>
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>🏛️ Público-Alvo:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              <Chip icon={<People />} label="Gestores públicos" variant="outlined" />
              <Chip icon={<Settings />} label="Administradores" variant="outlined" />
              <Chip icon={<Visibility />} label="Cidadãos" variant="outlined" />
              <Chip icon={<Assessment />} label="Auditores" variant="outlined" />
            </Box>
          </CardContent>
        </Card>

        {/* Instalação PWA */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneAndroid /> Instalação do PWA
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>🌐 No Navegador (Chrome/Edge):</Typography>
            <List>
              <ListItem>
                <ListItemText primary="1. Acesse o sistema no navegador" />
              </ListItem>
              <ListItem>
                <ListItemText primary='2. Procure o ícone de "Instalar" na barra de endereços' />
              </ListItem>
              <ListItem>
                <ListItemText primary='3. Clique em "Instalar SUPEL"' />
              </ListItem>
              <ListItem>
                <ListItemText primary="4. Confirme a instalação" />
              </ListItem>
            </List>
            
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                💡 <strong>Dica:</strong> O aplicativo aparecerá na área de trabalho e menu iniciar
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Seções Principais */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBook /> Seções do Manual
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><Security /></ListItemIcon>
                <ListItemText 
                  primary="Autenticação" 
                  secondary="Login, primeiro acesso, redefinição de senha"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assessment /></ListItemIcon>
                <ListItemText 
                  primary="Dashboard Principal" 
                  secondary="Métricas, cards de status, navegação"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Public /></ListItemIcon>
                <ListItemText 
                  primary="Painel Público" 
                  secondary="Consulta transparente de processos"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircle /></ListItemIcon>
                <ListItemText 
                  primary="Gestão de Processos" 
                  secondary="Criação, edição, acompanhamento"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Settings /></ListItemIcon>
                <ListItemText 
                  primary="Administração" 
                  secondary="Usuários, modalidades, situações"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Download /></ListItemIcon>
                <ListItemText 
                  primary="Relatórios" 
                  secondary="Exportação e análises"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Help /></ListItemIcon>
                <ListItemText 
                  primary="Solução de Problemas" 
                  secondary="Troubleshooting e suporte"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Links para documentação completa */}
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Business /> Documentação Adicional
            </Typography>
            
            <Typography variant="body1" paragraph>
              Para informações técnicas mais detalhadas, consulte a documentação no repositório:
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon><MenuBook /></ListItemIcon>
                <ListItemText 
                  primary="Manual Completo" 
                  secondary="docs/manual/MANUAL_USUARIO.md"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Settings /></ListItemIcon>
                <ListItemText 
                  primary="Diretrizes Técnicas" 
                  secondary="docs/DIRETRIZES_TECNICAS.md"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assessment /></ListItemIcon>
                <ListItemText 
                  primary="Arquitetura do Sistema" 
                  secondary="docs/ARQUITETURA_SISTEMA.md"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Help /></ListItemIcon>
                <ListItemText 
                  primary="Troubleshooting" 
                  secondary="docs/TROUBLESHOOTING.md"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            📅 Manual atualizado em: {new Date().toLocaleDateString('pt-BR')} | 
            Sistema SUPEL v1.4.0
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ManualPage;
