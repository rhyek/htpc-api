import path from 'path';
import fs from 'fs';
import Router from 'koa-router';
import xml2js from 'xml2js';
import {
  getExePath,
  htpcApiHelper,
  logger,
  multiMonitor,
  nirCmd,
  run,
} from '../shared';

export const router = new Router({ prefix: '/switch-room' });

interface Point {
  x: number;
  y: number;
}

interface Display {
  index: number;
  friendlyName: string;
  resolution: [number, number];
  topLeft: Point;
  rightBottom: Point;
  active: boolean;
  primary: boolean;
}

interface Displays {
  tv: Display;
  monitor: Display;
  mini: Display;
}

async function getDisplays(): Promise<Displays> {
  logger.info('Updating displays.');
  const xmlFilePath = path.resolve(__dirname, '../../displays.xml');
  await multiMonitor(`/sxml ${xmlFilePath}`);
  const xmlContent = fs.readFileSync(xmlFilePath, 'utf16le');
  const xml = await xml2js.parseStringPromise(xmlContent);
  const displays: Display[] = [];
  for (const item of xml.monitors_list.item) {
    let name = item.name[0] as string;
    const [index] = name.match(/\d+/)!;
    const display: Display = {
      index: parseInt(index),
      friendlyName: item.monitor_name[0],
      resolution: item.resolution[0].split(' X '),
      topLeft: {
        x: parseInt(item['left-top'][0].split(', ')[0]),
        y: parseInt(item['left-top'][0].split(', ')[1]),
      },
      rightBottom: {
        x: parseInt(item['right-bottom'][0].split(', ')[0]),
        y: parseInt(item['right-bottom'][0].split(', ')[1]),
      },
      active: item['active'][0] === 'Yes',
      primary: item['primary'][0] === 'Yes',
    };
    displays.push(display);
  }
  const dict: Displays = {
    tv: displays.find(d => d.friendlyName.includes('LG'))!,
    monitor: displays.find(d => d.friendlyName.includes('BenQ'))!,
    mini: displays.find(d => d.friendlyName === 'HDMI')!,
  };
  return dict;
}

function getMiddle(display: Display, axis: keyof Point, scaling: number) {
  const middle = Math.floor(
    ((display.rightBottom[axis] - display.topLeft[axis]) / 2 +
      display.topLeft[axis]) /
      (scaling / 100)
  );
  return middle;
}

function getDisplayCenterPoint(display: Display, scaling: number): Point {
  const x = getMiddle(display, 'x', scaling);
  const y = getMiddle(display, 'y', scaling);
  return { x, y };
}

async function moveMouseCursorToPoint({ x, y }: Point) {
  await htpcApiHelper(`movecursor ${x} ${y}`);
}

async function getTvScaling(): Promise<number> {
  const scaling = await htpcApiHelper('gettvscaling');
  return parseInt(scaling);
}

router.get('/', async ctx => {
  ctx.body = {
    tvScaling: await getTvScaling(),
    displays: await getDisplays(),
  };
});

router.get('/livingroom', async ctx => {
  logger.info('Switching to Living Room.');
  let displays = await getDisplays();
  await multiMonitor(`/enable ${displays.tv.index}`);
  await multiMonitor(`/setprimary ${displays.tv.index}`);
  displays = await getDisplays();
  const tvScaling = await getTvScaling();
  await moveMouseCursorToPoint(getDisplayCenterPoint(displays.tv, tvScaling));
  await nirCmd('setdefaultsounddevice "LG TV"');
  logger.info('Switched to Living Room.');
  ctx.body = null;
});

router.get('/bedroom', async ctx => {
  logger.info('Switching to Bedroom.');
  let displays = await getDisplays();
  await multiMonitor(`/disable ${displays.tv.index}`);
  await multiMonitor(`/setprimary ${displays.monitor.index}`);
  displays = await getDisplays();
  await moveMouseCursorToPoint(getDisplayCenterPoint(displays.monitor, 100));
  await nirCmd('setdefaultsounddevice "Speakers"');
  logger.info('Switched to Bedroom.');
  ctx.body = null;
});
