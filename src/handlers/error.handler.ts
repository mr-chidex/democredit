import { format, createLogger, transports, Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
const { timestamp, label, prettyPrint, combine } = format;

export class ErrorHandler {
  static async error(err: Error, _req: Request, res: Response, _next: NextFunction) {
    const logger: Logger = createLogger({
      level: 'info',
      format: combine(label({ label: 'error occurred' }), timestamp(), prettyPrint()),
      defaultMeta: { service: 'user-service' },
      transports: [
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'combined.log' }),
      ],
    });

    logger.log({
      level: 'info',
      message: err.message,
    });
    logger.log({
      level: 'error',
      message: err.message,
    });

    if (config.NODE_ENV !== 'production') {
      logger.add(
        new transports.Console({
          format: format.simple(),
        }),
      );

      return res.status(500).json({ message: err.message, error: true, stack: err.stack });
    }

    res.status(500).json({ message: err.message, error: true });
  }
}
