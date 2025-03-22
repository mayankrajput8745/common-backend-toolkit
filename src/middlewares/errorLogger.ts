import { transports, format } from 'winston';
import expressWinston from 'express-winston';
import { isEmpty } from 'lodash';
import { loadEsm } from 'load-esm';

let chalk: any;

interface Meta {
    error?: any,
    username?: any,
    [key: string]: any
}

const loadChalk = async () => {
    chalk = await loadEsm('chalk');
};

loadChalk();

export const errorLogger = expressWinston.errorLogger({
    transports: [new transports.Console()],
    format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {

            const { level, message, timestamp, meta } = info as {
                level: string,
                message: string,
                timestamp: string,
                meta: Meta
            };

            // Use chalk to colorize the log output
            const levelColor = level === 'error' ? chalk.red(level) : chalk.yellow(level);
            const timestampColor = chalk.green(timestamp);

            // Handle meta properties safely
            const error = !isEmpty(meta) && !isEmpty(meta.error) ? chalk.bgRed.white(` ${JSON.stringify(meta.error)} `) : 'No error';
            const username = !isEmpty(meta) && !isEmpty(meta.username) ? chalk.blue(` ${JSON.stringify(meta.username)} `) : 'No username';

            // Format the final log string with colorized parts
            return `${timestampColor} ${levelColor}: ${message}, username: ${username}, error: ${error}`;
        })
    ),
    meta: true,
    requestField: null,
    blacklistedMetaFields: ['process', 'stack', 'trace', 'os', 'message'],
    dynamicMeta: (req, res, _err) => {
        return {
            url: req.url,
            body: req.body,
            username: res.locals?.payload?.username,
            tokenId: res.locals?.payload?.tokenId,
            city: res.locals?.sessionLocation?.city,
        };
    },
    skip: (req, _res) => req.method === 'OPTIONS'
});