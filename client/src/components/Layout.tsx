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
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  CloudSync as CloudSyncIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import ChangePasswordDialog from './ChangePasswordDialog';
import HelpDialog from './HelpDialog';
import { useFullscreen } from '../hooks/useFullscreen';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import { usePWA } from '../hooks/usePWA';
import { usePageTracking } from '../hooks/usePageTracking';
import { APP_VERSION } from '../version';

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
    title: 'Adesões ARP',
    path: '/admin/adesoes',
    icon: <AssignmentIcon />,
    description: 'Gestão de processos de adesão a ata',
    permission: 'adesoes'
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
      },
      {
        title: 'Indicadores Gerenciais',
        path: '/admin/indicadores-gerenciais',
        icon: <AssessmentIcon />,
        description: 'Dashboard com métricas e indicadores do sistema',
        permission: 'indicadores-gerenciais'
      },
      {
        title: 'Sistema ARPS',
        path: '/admin/arps',
        icon: <PublicIcon />,
        description: 'Análise de Registro de Preços com Conclusão',
        permission: 'arps'
      },
      {
        title: 'API Keys',
        path: '/admin/api-keys',
        icon: <SecurityIcon />,
        description: 'Gerenciar chaves de API para webhooks',
        permission: 'api-keys'
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
      },
      {
        title: 'Licitações PCP',
        path: '/admin/microempresas-licitacoes',
        icon: <CloudSyncIcon />,
        description: 'Visualizar dados sincronizados do PCP',
        permission: 'microempresas-licitacoes'
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
      },
      {
        title: 'Tracking de Acesso',
        path: '/admin/access-tracking',
        icon: <AnalyticsIcon />,
        description: 'Logs de autenticação e páginas visitadas',
        adminOnly: true
      }
      ,
      {
        title: 'Configurações',
        path: '/admin/configuracoes',
        icon: <SettingsIcon />,
        description: 'Parâmetros e preferências do sistema',
        permission: 'configuracoes'
      }
    ]
  },
  {
    title: 'Painel Público',
    path: '/painel-publico',
    icon: <PublicIcon />,
    description: 'Painel público de processos',
    permission: 'painel-publico'
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

  // Hook para tracking de páginas visitadas
  usePageTracking();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [navAnchorEl, setNavAnchorEl] = useState<null | HTMLElement>(null);
  const [activeNavMenu, setActiveNavMenu] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const [scrolled, setScrolled] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Filtrar itens de navegação baseado nas permissões do usuário
  const filterNavigationItems = (items: any[]): any[] => {
    return items.filter(item => {
      // Ocultar Painel Público no modo PWA
      if ((isStandalone || isInstalled) && item.path === '/painel-publico') {
        return false;
      }

      // Verificar se o item é apenas para admins
      if (item.adminOnly && user?.perfil !== 'admin') {
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

  // Componente de dropdown simples para Painéis na AppBar (fora do Layout para evitar confusão de escopo)
  const DropdownPanels: React.FC<{ navigate: (p: string) => void; currentPath: string }> = ({ navigate, currentPath }) => {
    const { user } = useAuth();
    const [anchorElPanels, setAnchorElPanels] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorElPanels);
    const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorElPanels(e.currentTarget);
    const handleClose = () => setAnchorElPanels(null);

    const allItems = [
      { label: 'Painel Público', path: '/painel-publico', icon: <PublicIcon fontSize="small" />, permission: 'painel-publico' },
      { label: 'Painel Semana Atual', path: '/painel-semana-atual', icon: <ViewWeekIcon fontSize="small" />, permission: 'painel-semana-atual' }
    ];

    // Filtrar itens por permissão (admin vê tudo)
    const allowedItems = allItems.filter(it =>
      user?.perfil === 'admin' || user?.paginas_permitidas?.includes(it.permission)
    );

    // Se não houver itens permitidos, não renderiza o botão
    if (allowedItems.length === 0) return null;

    return (
      <>
        <Chip
          icon={<DashboardCustomizeIcon sx={{ color: '#ff9800 !important' }} />}
          label="Painéis"
          onClick={handleOpen}
          sx={{
            bgcolor: '#000000 !important',
            color: '#ffffff',
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid rgba(255,152,0,0.3)',
            '&:hover': {
              bgcolor: '#1a1a1a !important',
              borderColor: '#ff9800'
            },
            '& .MuiChip-icon': {
              color: '#ff9800'
            }
          }}
          variant={open ? 'filled' : 'outlined'}
        />
        <Menu anchorEl={anchorElPanels} open={open} onClose={handleClose} MenuListProps={{ dense: true }}>
          {allowedItems.map(it => (
            <MenuItem
              key={it.path}
              selected={currentPath === it.path}
              onClick={() => { navigate(it.path); handleClose(); }}
            >
              {it.icon}
              <Typography sx={{ ml: 1, fontSize: '0.85rem' }}>{it.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
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

  // Navegar para rota específica
  const handleNavigation = (path?: string) => {
    if (!path) return;
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao fazer logout', err);
    }
  };

  // Estrutura filtrada conforme permissões e modo PWA
  const filteredNavigationStructure = React.useMemo(
    () => filterNavigationItems(navigationStructure),
    [user, isStandalone, isInstalled]
  );

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


    const handleNavMenuLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        setNavAnchorEl(null);
        setActiveNavMenu(null);
      }, 300);
    };

    const cancelNavMenuLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };

    const horizontalItems = filteredNavigationStructure.filter(item => item.path !== '/painel-publico');
    const activeItem = horizontalItems.find(item => item.title === activeNavMenu);

    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}
        onMouseLeave={handleNavMenuLeave}
      >
        {horizontalItems.map((item) => {
          const isMainActive = isMainMenuActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isCurrentlyHovered = activeNavMenu === item.title;

          return (
            <Box
              key={item.title}
              onMouseEnter={(e) => {
                cancelNavMenuLeave();
                if (hasChildren) {
                  setNavAnchorEl(e.currentTarget);
                  setActiveNavMenu(item.title);
                } else {
                  setNavAnchorEl(null);
                  setActiveNavMenu(null);
                }
              }}
              onClick={() => {
                if (!hasChildren) {
                  if (item.isHelp) handleHelpClick();
                  else handleNavigation(item.path);
                  setNavAnchorEl(null);
                  setActiveNavMenu(null);
                }
              }}
              sx={{
                px: 1.5,
                py: 1,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: (isMainActive || isCurrentlyHovered) ? 600 : 400,
                color: '#ffffff',
                borderRadius: 1,
                position: 'relative',
                bgcolor: isCurrentlyHovered ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: (isMainActive || isCurrentlyHovered) ? '80%' : '0%',
                  height: '2px',
                  backgroundColor: '#ffffff',
                  borderRadius: '2px',
                  transition: 'width 0.2s ease',
                },
                '&:hover::after': { width: '80%' },
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {item.title}
                {hasChildren && (
                  <ExpandMoreIcon
                    sx={{
                      fontSize: '1rem',
                      transition: 'transform 0.2s',
                      transform: isCurrentlyHovered ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                )}
              </Box>
            </Box>
          );
        })}

        {/* Menu compartilhado — fora do loop para evitar múltiplas instâncias */}
        <Menu
          anchorEl={navAnchorEl}
          open={Boolean(navAnchorEl && activeItem?.children)}
          onClose={() => { setNavAnchorEl(null); setActiveNavMenu(null); }}
          // Cancelar o timeout ao entrar no dropdown
          MenuListProps={{
            onMouseEnter: cancelNavMenuLeave,
            onMouseLeave: handleNavMenuLeave,
            dense: true,
          }}
          slotProps={{
            paper: {
              onMouseEnter: cancelNavMenuLeave,
              onMouseLeave: handleNavMenuLeave,
              sx: {
                mt: 1, // Reintroduzido o recuo como solicitado (8px)
                minWidth: 220,
                borderRadius: 2,
                boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
                border: '1px solid',
                borderColor: 'divider',
                py: 0.5,
                // "Ponte" invisível para evitar que o mouse saia da área ao atravessar o gap
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -8,
                  left: 0,
                  right: 0,
                  height: 8,
                  backgroundColor: 'transparent',
                }
              }
            }
          }}
          // O segredo para hover estável: disablePortal={true} faz o Menu ser filho do Box trigger no DOM,
          // assim o mouse nunca "sai" do container pai ao entrar no menu.
          disablePortal
          disableScrollLock
          elevation={4}
        >
          {activeItem?.children?.map((child: any) => {
            const isActive = location.pathname === child.path;
            return (
              <MenuItem
                key={child.title}
                selected={isActive}
                onClick={() => {
                  if (child.isHelp) handleHelpClick();
                  else handleNavigation(child.path);
                  setNavAnchorEl(null);
                  setActiveNavMenu(null);
                }}
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'primary.main' : 'text.primary',
                  borderLeft: '3px solid',
                  borderLeftColor: isActive ? 'primary.main' : 'transparent',
                  py: 1.25,
                  px: 2,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                    color: 'primary.main',
                  },
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'action.hover'
                  },
                  transition: 'all 0.1s',
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, mr: 1, color: isActive ? 'primary.main' : 'inherit' }}>
                  {React.cloneElement(child.icon, { fontSize: 'small' })}
                </ListItemIcon>
                {child.title}
              </MenuItem>
            );
          })}
        </Menu>
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
          width: '100%',
          left: 0,
          right: 0,
          margin: 0,
        }}
      >
        <Toolbar sx={{
          width: '100%',
          px: 3,
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
                fontFamily: 'inherit',
                letterSpacing: 0.5,
                fontSize: { xs: '0.95rem', sm: '1.25rem', md: '1.5rem' }, // bem pequeno no mobile
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Controle de Processos
              <Chip
                label={`v${APP_VERSION}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  ml: 1,
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  borderColor: 'primary.main',
                  borderWidth: '1px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  '& .MuiChip-label': {
                    px: 1,
                    py: 0.5,
                    lineHeight: 1
                  }
                }}
              />
            </Typography>
          </Box>

          {/* Navegação horizontal para desktop */}
          {renderHorizontalNavigation()}

          {/* Menu Painéis */}
          <Box sx={{ ml: 2, display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <DropdownPanels navigate={handleNavigation} currentPath={location.pathname} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Botão de Ajuda - abre a nova página do manual */}
            <Tooltip title="Manual do Usuário">
              <IconButton
                onClick={() => handleNavigation('/manual')}
                size="small"
                sx={{
                  color: '#ffffff',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>

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
                  <Typography variant="body2" sx={{ fontWeight: 100, fontFamily: 'inherit', fontSize: '0.75rem', mt: 0.5, color: theme.palette.mode === 'light' ? '#fff' : 'text.primary', textAlign: 'center', lineHeight: 1 }}>
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