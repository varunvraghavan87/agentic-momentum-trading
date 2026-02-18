import { KiteTicker } from 'kiteconnect';
import { logger } from '../utils/logger';
import type { Tick } from '@amt/shared';

type TickCallback = (ticks: Tick[]) => void;

/**
 * Wraps KiteTicker for real-time market data streaming via WebSocket.
 * Handles connection lifecycle, auto-reconnect, and tick subscriptions.
 */
export class WebSocketHandler {
  private ticker: KiteTicker;
  private subscribedTokens: number[] = [];
  private tickCallbacks: TickCallback[] = [];
  private connected = false;

  constructor(apiKey: string, accessToken: string) {
    this.ticker = new KiteTicker({
      api_key: apiKey,
      access_token: accessToken,
    });
  }

  /**
   * Open the WebSocket connection and wire up event handlers.
   * Enables auto-reconnect with a 5-second interval, up to 50 retries.
   */
  connect(): void {
    this.ticker.autoReconnect(true, 50, 5);

    this.ticker.on('ticks', (ticks: any[]) => {
      const mapped: Tick[] = ticks.map((t) => ({
        instrumentToken: t.instrument_token,
        tradingsymbol: t.tradingsymbol,
        lastPrice: t.last_price,
        high: t.ohlc?.high ?? 0,
        low: t.ohlc?.low ?? 0,
        open: t.ohlc?.open ?? 0,
        close: t.ohlc?.close ?? 0,
        volume: t.volume_traded ?? t.volume ?? 0,
        change: t.change ?? undefined,
        timestamp: t.exchange_timestamp ? new Date(t.exchange_timestamp) : undefined,
      }));

      for (const cb of this.tickCallbacks) {
        try {
          cb(mapped);
        } catch (err) {
          logger.error({ error: (err as Error).message }, 'Error in tick callback');
        }
      }
    });

    this.ticker.on('connect', () => {
      this.connected = true;
      logger.info('WebSocket connected to Kite');

      // Re-subscribe if tokens were registered before connection
      if (this.subscribedTokens.length > 0) {
        this.ticker.subscribe(this.subscribedTokens);
        this.ticker.setMode(this.ticker.modeFull, this.subscribedTokens);
        logger.info(
          { tokens: this.subscribedTokens.length },
          'Re-subscribed instruments on connect',
        );
      }
    });

    this.ticker.on('disconnect', (code: number, reason: string) => {
      this.connected = false;
      logger.warn({ code, reason }, 'WebSocket disconnected');
    });

    this.ticker.on('error', (err: any) => {
      logger.error({ error: err?.message || err }, 'WebSocket error');
    });

    this.ticker.on('reconnect', (retries: number, interval: number) => {
      logger.info({ retries, interval }, 'WebSocket reconnecting');
    });

    this.ticker.connect();
    logger.info('WebSocket connection initiated');
  }

  /**
   * Subscribe to a list of instrument tokens for tick data.
   * Requests full-mode (quote + market depth) data.
   */
  subscribeInstruments(tokens: number[]): void {
    this.subscribedTokens = [...new Set([...this.subscribedTokens, ...tokens])];

    if (this.connected) {
      this.ticker.subscribe(tokens);
      this.ticker.setMode(this.ticker.modeFull, tokens);
      logger.info({ tokens: tokens.length }, 'Subscribed to instruments');
    } else {
      logger.debug(
        { tokens: tokens.length },
        'Tokens queued for subscription on connect',
      );
    }
  }

  /**
   * Register a callback to receive tick updates.
   */
  onTick(callback: TickCallback): void {
    this.tickCallbacks.push(callback);
  }

  /**
   * Whether the WebSocket is currently connected.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Cleanly shut down the WebSocket connection.
   */
  disconnect(): void {
    this.connected = false;
    this.tickCallbacks = [];
    this.subscribedTokens = [];

    try {
      this.ticker.disconnect();
    } catch {
      // Swallow errors during shutdown
    }

    logger.info('WebSocket disconnected cleanly');
  }
}
