import { createTestDb, type TestDb } from '../__tests__/helpers/test-db.js';

let testDbInstance: TestDb;

vi.mock('../db/client.js', () => ({
  getDb: () => testDbInstance.db,
}));

vi.mock('../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Import PaperBroker AFTER vi.mock() calls so the mocks are in place
const { PaperBroker } = await import('./paper-broker.js');

describe('PaperBroker', () => {
  let broker: InstanceType<typeof PaperBroker>;

  beforeEach(() => {
    testDbInstance = createTestDb();
    broker = new PaperBroker();
  });

  afterEach(() => {
    testDbInstance.cleanup();
  });

  it('placeOrder BUY MARKET logs order and returns PAPER- prefix ID', async () => {
    broker.updateLTP('NSE:INFY', 1500);

    const orderId = await broker.placeOrder({
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'MARKET',
      product: 'CNC',
      quantity: 10,
    });

    expect(orderId).toMatch(/^PAPER-/);

    const row = testDbInstance.sqlite
      .prepare('SELECT * FROM orders WHERE order_id = ?')
      .get(orderId) as Record<string, unknown>;

    expect(row).toBeDefined();
    expect(row.status).toBe('COMPLETE');
    expect(row.quantity).toBe(10);
    expect(row.mode).toBe('paper');
    expect(row.filled_quantity).toBe(10);
    expect(row.price).toBeCloseTo(1500 * 1.001, 2);
    expect(row.average_price).toBeCloseTo(1501.5, 2);
  });

  it('placeOrder BUY LIMIT fills at specified price', async () => {
    broker.updateLTP('NSE:INFY', 1500);

    const orderId = await broker.placeOrder({
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'LIMIT',
      product: 'CNC',
      quantity: 5,
      price: 1480,
    });

    const row = testDbInstance.sqlite
      .prepare('SELECT * FROM orders WHERE order_id = ?')
      .get(orderId) as Record<string, unknown>;

    expect(row).toBeDefined();
    expect(row.price).toBe(1480);
    expect(row.average_price).toBe(1480);
    expect(row.status).toBe('COMPLETE');
  });

  it('placeOrder SL order has OPEN status', async () => {
    broker.updateLTP('NSE:INFY', 1500);

    const orderId = await broker.placeOrder({
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'SELL',
      orderType: 'SL',
      product: 'CNC',
      quantity: 10,
      price: 1400,
      triggerPrice: 1400,
    });

    const row = testDbInstance.sqlite
      .prepare('SELECT * FROM orders WHERE order_id = ?')
      .get(orderId) as Record<string, unknown>;

    expect(row).toBeDefined();
    expect(row.status).toBe('OPEN');
    expect(row.filled_quantity).toBe(0);
    expect(row.average_price).toBeNull();
  });

  it('getLTP returns virtual prices and defaults', async () => {
    broker.updateLTP('NSE:RELIANCE', 2500);

    const result = await broker.getLTP(['NSE:RELIANCE', 'NSE:UNKNOWN']);

    expect(result['NSE:RELIANCE'].lastPrice).toBe(2500);
    expect(result['NSE:UNKNOWN'].lastPrice).toBe(100);
  });

  it('Multiple orders maintain correct state', async () => {
    broker.updateLTP('NSE:INFY', 1500);

    const id1 = await broker.placeOrder({
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'MARKET',
      product: 'CNC',
      quantity: 10,
    });

    const id2 = await broker.placeOrder({
      tradingsymbol: 'SBIN',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'MARKET',
      product: 'CNC',
      quantity: 20,
    });

    const id3 = await broker.placeOrder({
      tradingsymbol: 'RELIANCE',
      exchange: 'NSE',
      transactionType: 'SELL',
      orderType: 'SL',
      product: 'CNC',
      quantity: 5,
      price: 2400,
      triggerPrice: 2400,
    });

    const { count } = testDbInstance.sqlite
      .prepare('SELECT COUNT(*) as count FROM orders')
      .get() as { count: number };

    expect(count).toBe(3);

    const ids = [id1, id2, id3];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);

    for (const id of ids) {
      expect(id).toMatch(/^PAPER-/);
    }
  });
});
