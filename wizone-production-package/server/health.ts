import { Request, Response } from 'express';

export function healthCheck(req: Request, res: Response) {
  const healthInfo = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    node: process.version,
    env: process.env.NODE_ENV || 'development'
  };

  res.status(200).json(healthInfo);
}