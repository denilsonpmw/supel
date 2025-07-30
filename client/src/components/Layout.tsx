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
  MenuItem,
  Collapse,
  ListItemSecondaryAction
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
  Help as HelpIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Security as SecurityIcon
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

// Nova estrutura de navegação com menu e submenu
const navigationStructure = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    description: 'Visão geral do sistema',
    permission: 'dashboard'
  },
  {
    title: 'Processos',
    path: '/admin/processos',
    icon: <AssignmentIcon />,
    description: 'Gestão de processos de licitação',
    permission: 'processos'
  },
  {
    title: 'Relatórios',
    icon: <InsertChartIcon />,
    description: 'Sistema de relatórios e análises',
    children: [
      {
        title: 'Relatórios',
        path: '/admin/relatorios',
        icon: <DescriptionIcon />,
        description: 'Sistema de relatórios e análises',
        permission: 'relatorios'
      },
      {
        title: 'Processos por Responsável',
        path: '/admin/contador-responsaveis',
        icon: <BarChartIcon />,
        description: 'Análise de processos por responsável',
        permission: 'contador-responsaveis'
      }
    ]
  },
  {
    title: 'Cadastros',
    icon: <FolderIcon />,
    description: 'Gerenciamento de cadastros',
    children: [
      {
        title: 'Modalidades',
        path: '/admin/modalidades',
        icon: <CategoryIcon />,
        description: 'Tipos de licitação',
        permission: 'modalidades'
      },
      {
        title: 'Unidades Gestoras',
        path: '/admin/unidades-gestoras',
        icon: <BusinessIcon />,
        description: 'Órgãos responsáveis',
        permission: 'unidades-gestoras'
      },
      {
        title: 'Responsáveis',
        path: '/admin/responsaveis',
        icon: <PersonIcon />,
        description: 'Pessoas responsáveis',
        permission: 'responsaveis'
      },
      {
        title: 'Situações',
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
      }
    ]
  },
  {
    title: 'Security',
    icon: <SecurityIcon />,
    description: 'Configurações de segurança',
    children: [
      {
        title: 'Gerenciar Usuários',
        path: '/admin/usuarios',
        icon: <ManageAccountsIcon />,
        description: 'Gerenciar usuários e permissões',
        permission: 'usuarios'
      },
      {
        title: 'Auditoria',
        path: '/admin/auditoria',
        icon: <FactCheckIcon />,
        description: 'Sistema de auditoria e logs',
        permission: 'auditoria'
      }
    ]
  },
  {
    title: 'Painel Público',
    path: '/painel-publico',
    icon: <PublicIcon />,
    description: 'Painel público de processos',
    permission: 'painel-publico'
  },
  {
    title: 'Manual do Usuário',
    path: '/manual',
    icon: <HelpIcon />,
    description: 'Documentação do sistema',
    isHelp: true
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
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const lastScrollY = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrar itens de navegação baseado nas permissões do usuário
  const filterNavigationItems = (items: any[]): any[] => {
    return items.filter(item => {
      // Ocultar Painel Público no modo PWA
      if ((isStandalone || isInstalled) && item.path === '/painel-publico') {
        return false;
      }
      
      // Se tem filhos, filtrar os filhos
      if (item.children) {
        const filteredChildren = filterNavigationItems(item.children);
        // Só mostrar o menu pai se tiver pelo menos um filho com permissão
        return filteredChildren.length > 0;
      }
      
      // Se não tem permissão definida (como o manual) ou o usuário é admin, mostrar
      if (!item.permission || user?.perfil === 'admin') {
        return true;
      }
      
      // Se tem permissão definida, verificar se o usuário tem acesso
      return user?.paginas_permitidas?.includes(item.permission);
    }).map(item => {
      // Se tem filhos, retornar o item com os filhos filtrados
      if (item.children) {
        return {
          ...item,
          children: filterNavigationItems(item.children)
        };
      }
      return item;
    });
  };

  const filteredNavigationStructure = filterNavigationItems(navigationStructure);

  useEffect(() => {
    // console.log('🔄 Layout montado. Rota atual:', location.pathname);
    // console.log('👤 Usuário:', user);
    // console.log('📋 Estrutura de navegação filtrada:', filteredNavigationStructure);
  }, [location.pathname, user, filteredNavigationStructure]);

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

  const handleMenuToggle = (menuTitle: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle]
    }));
  };

  const handleHelpClick = () => {
    setHelpDialogOpen(true);
  };

  const drawerWidth = 280;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cleanup do timeout quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

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
    const handleFullscreenChange = () => {
      const isInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isInFullscreen) {
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

  // Renderizar item de navegação
  const renderNavigationItem = (item: any, level: number = 0) => {
    const isActive = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.title] || false;
    const isMainActive = hasChildren ? isMainMenuActive(item) : false;
    
    if (hasChildren) {
      return (
        <React.Fragment key={item.title}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleMenuToggle(item.title)}
              selected={isMainActive}
              sx={{
                pl: level * 2 + 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
                '&:hover': {
                  bgcolor: isMainActive ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {React.cloneElement(item.icon, {
                  sx: {
                    color: isMainActive ? 'primary.contrastText' : 'inherit',
                    ...item.icon.props.sx,
                  }
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.title} 
                primaryTypographyProps={{ 
                  fontSize: '0.875rem',
                  fontWeight: isMainActive ? 600 : 500
                }}
              />
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child: any) => renderNavigationItem(child, level + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.title} disablePadding>
        <ListItemButton
          onClick={() => {
            if (item.isHelp) {
              handleHelpClick();
            } else {
              handleNavigation(item.path);
            }
          }}
          selected={isActive}
          sx={{
            pl: level * 2 + 2,
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
            '&:hover': {
              bgcolor: isActive ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {React.cloneElement(item.icon, {
              sx: {
                color: isActive ? 'primary.contrastText' : 'inherit',
                ...item.icon.props.sx,
              }
            })}
          </ListItemIcon>
          <ListItemText 
            primary={item.title} 
            primaryTypographyProps={{ 
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  // Função para verificar se um menu principal deve ser destacado
  const isMainMenuActive = (menuItem: any) => {
    if (!menuItem.children) return false;
    
    // Verifica se algum submenu está ativo
    return menuItem.children.some((child: any) => location.pathname === child.path);
  };

  // Renderizar navegação horizontal para desktop
  const renderHorizontalNavigation = () => {
    if (isMobile) return null;

    const handleMenuEnter = (menuTitle: string) => {
      // Limpar qualquer timeout pendente
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      // Abrir o menu imediatamente
      setExpandedMenus({ [menuTitle]: true });
    };

    const handleMenuLeave = () => {
      // Adicionar um delay antes de fechar o menu
      hoverTimeoutRef.current = setTimeout(() => {
        setExpandedMenus({});
      }, 300); // 300ms de delay
    };

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
        {filteredNavigationStructure.map((item) => {
          if (item.children) {
            // Menu com submenu - abre ao passar o mouse
            const isExpanded = expandedMenus[item.title] || false;
            const isMainActive = isMainMenuActive(item);
            
            return (
              <Box 
                key={item.title} 
                sx={{ position: 'relative' }}
                onMouseEnter={() => handleMenuEnter(item.title)}
                onMouseLeave={handleMenuLeave}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 400,
                    color: (isExpanded || isMainActive) ? '#fff' : 'text.secondary',
                    borderRadius: 2,
                    bgcolor: (isExpanded || isMainActive) ? 'primary.main' : 'transparent',
                    '&:hover': {
                      bgcolor: (isExpanded || isMainActive) ? 'primary.dark' : 'action.hover',
                      color: '#fff',
                    },
                    transition: 'background 0.2s',
                    userSelect: 'none',
                  }}
                >
                  {item.title}
                </Box>
                {/* Submenu dropdown */}
                {isExpanded && (
                  <Box
                    onMouseEnter={() => handleMenuEnter(item.title)} // Manter aberto quando hover no submenu
                    onMouseLeave={handleMenuLeave}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      zIndex: 1000,
                      bgcolor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      boxShadow: 3,
                      minWidth: 200,
                      mt: 1,
                    }}
                  >
                    {item.children.map((child: any) => {
                      const isActive = location.pathname === child.path;
                      return (
                        <Box
                          key={child.title}
                          onClick={() => {
                            if (child.isHelp) {
                              handleHelpClick();
                            } else {
                              handleNavigation(child.path);
                            }
                            setExpandedMenus({}); // Fecha o submenu ao clicar
                            // Limpar timeout se houver
                            if (hoverTimeoutRef.current) {
                              clearTimeout(hoverTimeoutRef.current);
                              hoverTimeoutRef.current = null;
                            }
                          }}
                          sx={{
                            px: 2,
                            py: 1.5,
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 400,
                            color: isActive ? '#fff' : 'text.primary',
                            bgcolor: isActive ? 'primary.main' : 'transparent',
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: isActive ? 'primary.dark' : 'action.hover',
                              color: '#fff',
                            },
                          }}
                        >
                          {child.title}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          } else {
            // Item simples
            const isActive = location.pathname === item.path;
            return (
              <Box
                key={item.title}
                onClick={() => {
                  if (item.isHelp) {
                    handleHelpClick();
                  } else {
                    handleNavigation(item.path);
                  }
                  setExpandedMenus({});
                }}
                sx={{
                  px: 2,
                  py: 1,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 400,
                  color: isActive ? '#fff' : 'text.secondary',
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    color: '#fff',
                  },
                  transition: 'background 0.2s',
                  userSelect: 'none',
                }}
              >
                {item.title}
              </Box>
            );
          }
        })}
      </Box>
    );
  };

  // console.log('🎯 Renderizando Layout com children:', children);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#010409 !important',
          width: '100%',
          left: 0,
          right: 0,
          margin: 0,
        }}
      >
        <Toolbar sx={{ 
          width: '100%', 
          px: 3,
          backgroundColor: '#010409 !important',
        }}>
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
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 200, 
                fontFamily: 'Roboto', 
                letterSpacing: 0.5,
                fontSize: { xs: '0.95rem', sm: '1.25rem', md: '1.5rem' }, // bem pequeno no mobile
                color: '#ffffff',
              }}
            >
              Controle de Processos
            </Typography>
          </Box>
          
          {/* Navegação horizontal para desktop */}
          {renderHorizontalNavigation()}
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggle />
            <Tooltip title="Configurações da conta">
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 1 }}>
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
                      bgcolor: theme.palette.mode === 'dark' ? '#ff5d14' : theme.palette.primary.main,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                    }}
                  >
                    {user?.nome?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
                {user?.nome && (
                  <Typography variant="body2" sx={{ fontWeight: 100, fontFamily: 'Roboto', fontSize: '0.75rem', mt: 0.5, color: theme.palette.mode === 'light' ? '#fff' : 'text.primary', textAlign: 'center', lineHeight: 1 }}>
                    {user.nome.split(' ')[0]}
                  </Typography>
                )}
              </Box>
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

      {/* Drawer/Sidebar - apenas para mobile */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            zIndex: theme.zIndex.drawer,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: 8, // Espaço para a AppBar
              height: 'calc(100vh - 64px)',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Box sx={{ overflow: 'auto', py: 1 }}>
            <List>
              {filteredNavigationStructure.map((item) => renderNavigationItem(item))}
            </List>
          </Box>
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          pt: 8, // Espaço para a AppBar
          pb: 3,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
          ml: 0, // Sem margem no desktop
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