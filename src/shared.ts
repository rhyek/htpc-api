import path from 'path';
import util from 'util';
import { exec } from 'child_process';
import winston from 'winston';
import moment from 'moment';

export const _run = util.promisify(exec);

export async function run(command: string): Promise<string> {
  const { stdout, stderr } = await _run(command);
  if (!stderr) {
    return stdout;
  }
  throw new Error(stderr);
}

export const isDev = process.env.NODE_ENV === 'development';

const transports: winston.transports.StreamTransportInstance[] = [
  new winston.transports.Console(),
];
if (!isDev) {
  transports.push(
    new winston.transports.File({
      filename: path.resolve(__dirname, '../log'),
    })
  );
}
export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.printf(({ level, message }) => {
    return `${moment().format()} [${level}]: ${message.toString()}`;
  }),
  transports,
});

export function getExePath(suffix: string): string {
  return path.resolve(__dirname, '../binaries', suffix);
}

export async function multiMonitor(command: string) {
  await run(
    `${getExePath('NirSoft/MultiMonitorTool/MultiMonitorTool.exe')} ${command}`
  );
}

export async function nirCmd(command: string) {
  await run(`${getExePath('NirSoft/NirCmd/NirCmd.exe')} ${command}`);
}

export async function htpcApiHelper(command: string) {
  return run(
    `${getExePath(
      'me/HtpcApiHelper/bin/Release/netcoreapp3.1/HtpcApiHelper.exe'
    )} ${command}`
  );
}
