import type { FastifyInstance } from 'fastify';
import { KiteClient } from '../../broker/kite-client.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

let kiteClient: KiteClient | null = null;
let currentAccessToken: string | null = null;

export function getKiteClient(): KiteClient | null {
  return kiteClient;
}

export function getCurrentAccessToken(): string | null {
  return currentAccessToken;
}

export async function authRoutes(app: FastifyInstance) {
  app.get('/login', async () => {
    const kc = new KiteClient(config.KITE_API_KEY, config.KITE_API_SECRET);
    kiteClient = kc;
    const loginURL = kc.getLoginURL();
    return { loginURL };
  });

  app.get('/callback', async (request) => {
    const { request_token } = request.query as { request_token?: string };

    if (!request_token) {
      return { error: 'Missing request_token parameter' };
    }

    if (!kiteClient) {
      kiteClient = new KiteClient(config.KITE_API_KEY, config.KITE_API_SECRET);
    }

    try {
      const session = await kiteClient.generateSession(request_token);
      currentAccessToken = session.accessToken;
      logger.info({ userId: session.userId }, 'Kite Connect authenticated successfully');

      return {
        status: 'authenticated',
        userId: session.userId,
        loginTime: session.loginTime,
      };
    } catch (err) {
      logger.error({ error: err }, 'Kite authentication failed');
      return { error: 'Authentication failed' };
    }
  });

  app.get('/status', async () => {
    return {
      authenticated: currentAccessToken !== null,
      mode: config.TRADING_MODE,
    };
  });
}
