import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Button,
  Skeleton
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string | React.ReactNode;
}

interface LazyTableProps {
  columns: Column[];
  data: any[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  rowHeight?: number;
  maxHeight?: number;
  enableVirtualization?: boolean;
  emptyMessage?: string;
}

const LazyTable: React.FC<LazyTableProps> = ({
  columns,
  data,
  loading,
  hasMore,
  onLoadMore,
  rowHeight = 53,
  maxHeight = 600,
  enableVirtualization = false,
  emptyMessage = 'Nenhum dado encontrado'
}) => {
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(20);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Virtualização básica - mostrar apenas itens visíveis
  const visibleData = enableVirtualization 
    ? data.slice(visibleStart, visibleEnd)
    : data;

  // Intersection Observer para lazy loading automático
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Scroll handler para virtualização
  const handleScroll = useCallback(() => {
    if (!enableVirtualization || !tableContainerRef.current) return;

    const container = tableContainerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    const newVisibleStart = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(containerHeight / rowHeight) + 5; // Buffer
    const newVisibleEnd = Math.min(newVisibleStart + visibleCount, data.length);

    setVisibleStart(newVisibleStart);
    setVisibleEnd(newVisibleEnd);
  }, [enableVirtualization, rowHeight, data.length]);

  // Attach scroll listener
  useEffect(() => {
    if (!enableVirtualization) return;

    const container = tableContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, enableVirtualization]);

  // Skeleton loading para primeira carga
  const renderSkeletonRows = (count: number) => {
    return Array.from({ length: count }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column) => (
          <TableCell key={column.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Renderizar célula com formatação
  const renderCell = (column: Column, value: any) => {
    if (column.format) {
      return column.format(value);
    }
    return value;
  };

  return (
    <TableContainer 
      component={Paper} 
      sx={{ maxHeight }}
      ref={tableContainerRef}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Spacer para virtualização - itens antes da área visível */}
          {enableVirtualization && visibleStart > 0 && (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                style={{ height: visibleStart * rowHeight, padding: 0, border: 'none' }}
              />
            </TableRow>
          )}

          {/* Dados visíveis */}
          {visibleData.length > 0 ? (
            visibleData.map((row, index) => (
              <TableRow 
                key={row.id || index}
                hover
                style={{ height: rowHeight }}
              >
                {columns.map((column) => (
                  <TableCell key={column.id} align={column.align}>
                    {renderCell(column, row[column.id])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            // Mostrar skeleton ou mensagem vazia
            data.length === 0 && loading ? (
              renderSkeletonRows(5)
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box py={4}>
                    <Typography variant="body2" color="textSecondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )
          )}

          {/* Spacer para virtualização - itens depois da área visível */}
          {enableVirtualization && visibleEnd < data.length && (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                style={{ height: (data.length - visibleEnd) * rowHeight, padding: 0, border: 'none' }}
              />
            </TableRow>
          )}

          {/* Loading row */}
          {loading && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box py={2} display="flex" alignItems="center" justifyContent="center" gap={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando...</Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}

          {/* Load more button/trigger */}
          {hasMore && !loading && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box ref={loadMoreRef}>
                  <Button
                    variant="outlined"
                    startIcon={<ExpandMoreIcon />}
                    onClick={onLoadMore}
                    sx={{ m: 2 }}
                  >
                    Carregar mais itens
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LazyTable; 