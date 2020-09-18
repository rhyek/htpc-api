require('dotenv').config();
import Koa from 'koa';
import bodyParser from 'koa-body';
import helmet from 'koa-helmet';
import Router from 'koa-router';
import { Unauthorized } from 'http-errors';
import { router as switchRoom } from './routers/switch-room'
import { isDev, logger } from './shared';

if (!process.env.AUTH_TOKEN) {
  throw new Error('Auth token not set.');
}

const app = new Koa();
app.use(helmet());
app.use(bodyParser());
app.use(async (ctx, next) => {
  let error: (Error & { statusCode?: number }) | undefined;
  try {
    await next();
  } catch (e) {
    error = e;
    throw error;
  } finally {
    logger[error ? 'error' : 'info'](
      `${ctx.request.headers['x-forwarded-for'] ?? ctx.request.ip} ${ctx.request.method} ${ctx.request.url} ${error ? error.statusCode ?? 500 : ctx.response.status}`
    );
  }
});
app.use(async (ctx, next) => {
  if (ctx.req.headers['x-token'] !== process.env.AUTH_TOKEN) {
    throw new Unauthorized();
  }
  await next();
});

const router = new Router();

router.get('/', async ctx => {
  ctx.body = 'hi :)';
});

app.use(router.routes()).use(router.allowedMethods());
app.use(switchRoom.routes()).use(switchRoom.allowedMethods());

async function start() {
  const port = isDev ? 3000 : 10701;
  app.listen(port, () => {
    logger.info(`Listening on port ${port}.`);
  });
}

start();
