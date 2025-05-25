import { createLogger, transports, format } from 'winston';

const LogLevel = process.env.NODE_ENV === 'production' ? 'verbose' : 'debug';

const ConsoleTransport = new transports.Console({
    level: LogLevel,
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
            if (info.stack) return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`; // Custom format for error logs
            if (info.name === 'GENERIC_ERROR') return `${info.timestamp} ${info.level}: ${info.type}`; // Format for API Errors
            return `${info.timestamp} ${info.level}: ${info.message}`; // Default format for other logs
        })
    )
});

export const logger = createLogger({
    transports: ConsoleTransport,
    exceptionHandlers: ConsoleTransport,
    exitOnError: false
});
