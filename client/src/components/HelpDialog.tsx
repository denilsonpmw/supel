import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Assessment as AssessmentIcon,
  Login as LoginIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const HelpDialog: React.FC<HelpDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string | false>('login');

  const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const helpContent = [
    {
      id: 'login',
      title: '🔐 Login e Primeiro Acesso',
      icon: <LoginIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Como fazer login no sistema
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Acesso inicial"
                secondary="Digite seu email e senha fornecidos pelo administrador do sistema"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Primeiro acesso"
                secondary="Na primeira vez, você será direcionado para definir uma nova senha"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Esqueci minha senha"
                secondary="Entre em contato com o administrador para redefinir sua senha"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Dicas de Segurança
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Senha segura"
                secondary="Use uma senha com pelo menos 8 caracteres, incluindo letras, números e símbolos"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="warning" />
              </ListItemIcon>
              <ListItemText 
                primary="Logout"
                secondary="Sempre faça logout ao terminar de usar o sistema, especialmente em computadores compartilhados"
              />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      id: 'dashboard',
      title: '📊 Dashboard - Visão Geral',
      icon: <DashboardIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            O que você encontra no Dashboard
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <BarChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Métricas Principais"
                secondary="Total de processos, processos em andamento, concluídos e atrasados"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PieChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Gráficos de Distribuição"
                secondary="Processos por modalidade, situação e unidade gestora"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <TableChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Mapa de Calor"
                secondary="Visualização dos processos por semana, mostrando volume de trabalho"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Como usar o Dashboard
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <RefreshIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Atualizar dados"
                secondary="Clique no botão de atualizar para ver os dados mais recentes"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <VisibilityIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Detalhes dos gráficos"
                secondary="Passe o mouse sobre os gráficos para ver informações detalhadas"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <AssignmentIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Acessar processos"
                secondary="Clique nos números para ir diretamente para a lista de processos"
              />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      id: 'processos',
      title: '📋 Processos - Gestão Completa',
      icon: <AssignmentIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Funcionalidades Principais
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <SearchIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Buscar Processos"
                secondary="Use a barra de busca para encontrar processos por número, objeto ou responsável"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <FilterIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Filtrar Resultados"
                secondary="Aplique filtros por modalidade, situação, unidade gestora e período"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <AddIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Adicionar Processo"
                secondary="Clique no botão '+' para criar um novo processo de licitação"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Gerenciando Processos
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <EditIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Editar Processo"
                secondary="Clique no ícone de editar para modificar informações do processo"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <VisibilityIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Visualizar Detalhes"
                secondary="Clique no processo para ver todas as informações completas"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DeleteIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Excluir Processo"
                secondary="Use com cuidado - esta ação não pode ser desfeita"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Importação em Lote
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <UploadIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Upload de CSV"
                secondary="Importe múltiplos processos de uma vez usando arquivo CSV"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DownloadIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Template de Importação"
                secondary="Baixe o modelo de arquivo CSV para importação correta"
              />
            </ListItem>
          </List>
        </Box>
      )
    },
    {
      id: 'relatorios',
      title: '📈 Relatórios - Análises e Exportação',
      icon: <AssessmentIcon />,
      content: (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Tipos de Relatórios Disponíveis
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <BarChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Relatório Geral"
                secondary="Visão completa de todos os processos com filtros avançados"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <PieChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Análise por Modalidade"
                secondary="Distribuição de processos por tipo de licitação"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <TableChartIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Análise por Responsável"
                secondary="Processos organizados por pessoa responsável"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Como Gerar Relatórios
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <FilterIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Definir Filtros"
                secondary="Selecione período, modalidades, situações e responsáveis"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <DownloadIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Exportar Dados"
                secondary="Baixe relatórios em Excel ou PDF para uso offline"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <VisibilityIcon color="action" />
              </ListItemIcon>
              <ListItemText 
                primary="Visualizar Online"
                secondary="Veja os relatórios diretamente no navegador antes de exportar"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
            Dicas para Relatórios Eficientes
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Filtros Específicos"
                secondary="Use filtros específicos para obter relatórios mais precisos e úteis"
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <HelpIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary="Exportação Regular"
                secondary="Exporte relatórios regularmente para manter histórico de dados"
              />
            </ListItem>
          </List>
        </Box>
      )
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Manual do Usuário - SUPEL
          </Typography>
        </Box>
        <Tooltip title="Fechar">
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Este manual contém informações essenciais sobre como usar o sistema SUPEL. 
            Selecione uma seção abaixo para ver as instruções detalhadas.
          </Typography>
          
          {helpContent.map((section) => (
            <Accordion
              key={section.id}
              expanded={expanded === section.id}
              onChange={handleAccordionChange(section.id)}
              sx={{
                mb: 1,
                '&:before': { display: 'none' },
                boxShadow: 'none',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {section.icon}
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {section.title}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {section.content}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained">
          Fechar Manual
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpDialog; 