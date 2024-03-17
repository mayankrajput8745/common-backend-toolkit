import { transports, format } from 'winston';
import expressWinston from 'express-winston';

export const apiLogger = expressWinston.logger({
    transports: [
        new transports.Console()
    ],
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp, stack }) => {
            if (stack) return `${timestamp} ${level}: ${message}\n${stack}`;// Custom format for error logs
            return `${timestamp} ${level}: ${message}`;// Default format for other logs
        })

    ),
    meta: false,
    expressFormat: true,
    colorize: true,
    skip: (req, _res) => req.method === 'OPTIONS' // Skip logging for OPTIONS requests
});