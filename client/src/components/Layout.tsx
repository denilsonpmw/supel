import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Category as CategoryIcon,
  Flag as FlagIcon,
  Group as GroupIcon,
  Groups as GroupsIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ViewSidebar as ViewSidebarIcon,
  ViewHeadline as ViewHeadlineIcon,
  Assessment as AssessmentIcon,
  InsertChart as InsertChartIcon,
  FactCheck as FactCheckIcon,
  Public as PublicIcon,
  ManageAccounts as ManageAccountsIcon,
  ClearAll as ClearAllIcon,
  Lock as LockIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  BarChart as BarChartIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import ChangePasswordDialog from './ChangePasswordDialog';
import HelpDialog from './HelpDialog';
import { useFullscreen } from '../hooks/useFullscreen';
import { usePWA } from '../hooks/usePWA';

interface LayoutProps {
  children?: ReactNode;
}

const navigationItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    description: 'Visao geral do sistema',
    permission: 'dashboard'
  },
  {
    title: 'Processos',
    path: '/admin/processos',
    icon: <AssignmentIcon />,
    description: 'Gestao de processos de licitacao',
    badge: 'Principal',
    permission: 'processos'
  },
  {
    title: 'Modalidades',
    path: '/admin/modalidades',
    icon: <CategoryIcon />,
    description: 'Tipos de licitacao',
    permission: 'modalidades'
  },
  {
    title: 'Unidades Gestoras',
    path: '/admin/unidades-gestoras',
    icon: <BusinessIcon />,
    description: 'Orgaos responsaveis',
    permission: 'unidades-gestoras'
  },
  {
    title: 'Responsaveis',
    path: '/admin/responsaveis',
    icon: <PersonIcon />,
    description: 'Pessoas responsaveis',
    permission: 'responsaveis'
  },
  {
    title: 'Situacoes',
    path: '/admin/situacoes',
    icon: <FlagIcon />,
    description: 'Status dos processos',
    permission: 'situacoes'
  },
  {
    title: 'Equipe de Apoio',
    path: '/admin/equipe-apoio',
    icon: <GroupsIcon />,
    description: 'Membros da equipe',
    permission: 'equipe-apoio'
  },
  {
    title: 'Relatórios',
    path: '/admin/relatorios',
    icon: <InsertChartIcon />,
    description: 'Sistema de relatórios e análises',
    badge: 'Novo',
    permission: 'relatorios'
  },
  {
    title: 'Contador de Responsáveis',
    path: '/admin/contador-responsaveis',
    icon: <BarChartIcon />,
    description: 'Análise de processos por responsável',
    badge: 'Análise',
    permission: 'contador-responsaveis'
  },
  {
    title: 'Usuários',
    path: '/admin/usuarios',
    icon: <ManageAccountsIcon />,
    description: 'Gerenciar usuários e permissões',
    badge: 'Admin',
    permission: 'usuarios'
  },
  {
    title: 'Auditoria',
    path: '/admin/auditoria',
    icon: <FactCheckIcon />,
    description: 'Sistema de auditoria e logs',
    badge: 'Auditoria',
    permission: 'auditoria'
  },
  {
    title: 'Painel Público',
    path: '/painel-publico',
    icon: <PublicIcon />,
    description: 'Painel público de processos',
    badge: 'Público'
  }
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, clearCache } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isPWA, isFullscreen, toggleFullscreen, enterFullscreen } = useFullscreen();
  const { isStandalone, isInstalled } = usePWA();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState<'side' | 'top'>('side');
  const [hideAppBar, setHideAppBar] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const lastScrollY = useRef(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    console.log('🔄 Layout montado. Rota atual:', location.pathname);
  }, [location.pathname]);

  // Filtrar itens de navegação baseado nas permissões do usuário
  const filteredNavigationItems = navigationItems.filter(item => {
    // Ocultar Painel Público no modo PWA
    if ((isStandalone || isInstalled) && item.path === '/painel-publico') {
      return false;
    }
    // Se não tem permissão definida (como o painel público) ou o usuário é admin, mostrar
    if (!item.permission || user?.perfil === 'admin') {
      return true;
    }
    // Se tem permissão definida, verificar se o usuário tem acesso
    return user?.paginas_permitidas?.includes(item.permission);
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarVisibility = () => {
    setSidebarHidden(!sidebarHidden);
  };

  const toggleSidebarPosition = () => {
    setSidebarPosition(prev => prev === 'side' ? 'top' : 'side');
  };

  const drawerWidth = sidebarHidden ? 0 : 280;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setHideAppBar(true); // rolando para baixo
      } else {
        setHideAppBar(false); // rolando para cima
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Renderizar navegação horizontal quando posição for 'top'
  const renderTopNavigation = () => {
    if (sidebarPosition !== 'top' || sidebarHidden) return null;

    return (
      <AppBar 
        position="fixed" 
        sx={{ 
          top: hideAppBar ? 0 : 64,
          zIndex: theme.zIndex.drawer,
          bgcolor: scrolled 
            ? theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.6)' 
              : 'rgba(255, 255, 255, 0.8)'
            : undefined,
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s ease',
          width: '100%',
          left: 0,
          right: 0,
          margin: 0,
        }}
      >
        <Toolbar sx={{ minHeight: 56, maxWidth: 1440, width: '100%', mx: 'auto', px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, overflow: 'auto', flexGrow: 1 }}>
            {filteredNavigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.path} title={item.description}>
                  <IconButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: {
                        color: isActive ? '#fff' : 'rgba(156,163,175,0.8)',
                        ...item.icon.props.sx,
                      }
                    })}
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        </Toolbar>
      </AppBar>
    );
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleChangePassword = () => {
    setChangePasswordOpen(true);
    handleMenuClose();
  };

  // Bloquear saída do fullscreen no modo PWA
  useEffect(() => {
    if (!isPWA) return;
    // Handler para forçar fullscreen se sair
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isInFullscreen) {
        // Pequeno delay para evitar loop infinito caso o navegador bloqueie
        setTimeout(() => {
          enterFullscreen();
        }, 200);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isPWA, enterFullscreen]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          backgroundColor: scrolled 
            ? theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.6)'
              : 'rgba(255, 255, 255, 0.8)'
            : undefined,
          width: '100%',
          left: 0,
          right: 0,
          margin: 0,
        }}
      >
        <Toolbar sx={{ width: '100%', px: 3 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src="/supel-logo.png" 
              alt="SUPEL" 
              style={{ height: 40 }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
              Controle de Processos
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
            {filteredNavigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.path} title={item.description}>
                  <IconButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive ? 'primary.main' : 'transparent',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: {
                        color: isActive ? '#fff' : 'rgba(156,163,175,0.8)',
                        ...item.icon.props.sx,
                      }
                    })}
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Manual do Usuário">
              <IconButton
                onClick={() => setHelpDialogOpen(true)}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
            <ThemeToggle />
            {user?.nome && (
              <Typography variant="body1" sx={{ mr: 1, fontWeight: 500, color: 'text.primary' }}>
                {user.nome.split(' ')[0]}
              </Typography>
            )}
            <Tooltip title="Configurações da conta">
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ 
                  p: 0.5,
                  border: '2px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.primary.main,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.nome?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 180,
                  '& .MuiMenuItem-root': {
                    fontSize: '0.875rem',
                    py: 1,
                    px: 2,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {user?.nome || 'Usuário'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {user?.email}
                </Typography>
              </Box>
              <MenuItem onClick={handleChangePassword}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LockIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Alterar Senha" primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
              <MenuItem onClick={toggleFullscreen}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText 
                  primary={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"} 
                  primaryTypographyProps={{ fontSize: '0.875rem' }} 
                />
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navegação Superior */}
      {renderTopNavigation()}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: { 
            xs: sidebarPosition === 'top' ? 16 : 8, 
            sm: sidebarPosition === 'top' ? 16 : 8 
          },
          pb: 3,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default
        }}
      >
        {children}
      </Box>

      {/* Dialog de alteração de senha */}
      <ChangePasswordDialog 
        open={changePasswordOpen} 
        onClose={() => setChangePasswordOpen(false)} 
      />
      
      {/* Dialog de ajuda */}
      <HelpDialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)} 
      />
    </Box>
  );
};

export default Layout; 