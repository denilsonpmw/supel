import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message } = error;

  // Log do erro para desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Erro capturado:', {
      statusCode,
      message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Erro de validação do Joi
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Dados inválidos',
      details: message,
    });
    return;
  }

  // Erro de banco de dados
  if (error.name === 'DatabaseError' || (error as any).code) {
    const dbError = error as any;
    
    // Violação de chave única
    if (dbError.code === '23505') {
      res.status(409).json({
        error: 'Dados duplicados',
        message: 'Este registro já existe no sistema',
      });
      return;
    }

    // Violação de chave estrangeira
    if (dbError.code === '23503') {
      res.status(400).json({
        error: 'Referência inválida',
        message: 'Um ou mais campos referenciam dados inexistentes',
      });
      return;
    }

    // Violação de constraint
    if (dbError.code === '23514') {
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Os dados não atendem aos critérios estabelecidos',
      });
      return;
    }

    // Outros erros de banco
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: process.env.NODE_ENV === 'development' 
        ? dbError.message 
        : 'Ocorreu um erro interno. Tente novamente.',
    });
    return;
  }

  // Erro JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Token expirado',
      message: 'Token de autenticação expirado',
    });
    return;
  }

  // Resposta padrão para erros
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Erro interno do servidor' : message,
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Ocorreu um erro interno. Tente novamente.'
      : message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}; 