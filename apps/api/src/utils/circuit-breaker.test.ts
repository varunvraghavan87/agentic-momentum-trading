import { CircuitBreaker } from './circuit-breaker';

vi.mock('./logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test', 3, 100);
    vi.restoreAllMocks();
  });

  it('starts in closed state', () => {
    expect(breaker.getState()).toBe('closed');
  });

  it('stays closed after successful calls', async () => {
    await breaker.execute(() => Promise.resolve('ok'));
    await breaker.execute(() => Promise.resolve('ok'));
    expect(breaker.getState()).toBe('closed');
  });

  it('opens after maxFailures consecutive failures', async () => {
    const fail = () => Promise.reject(new Error('fail'));

    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fail)).rejects.toThrow('fail');
    }

    expect(breaker.getState()).toBe('open');
  });

  it('throws without executing the function while open', async () => {
    const fail = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fail)).rejects.toThrow();
    }

    const fn = vi.fn(() => Promise.resolve('ok'));
    await expect(breaker.execute(fn)).rejects.toThrow(/OPEN/);
    expect(fn).not.toHaveBeenCalled();
  });

  it('transitions to half-open after resetTimeMs', async () => {
    const fail = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fail)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe('open');

    // Advance time past the reset window
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);

    // Next execute should transition to half-open and attempt the call
    await breaker.execute(() => Promise.resolve('recovered'));
    // After a successful call in half-open, it resets to closed
    expect(breaker.getState()).toBe('closed');
  });

  it('resets to closed on successful call in half-open state', async () => {
    const fail = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fail)).rejects.toThrow();
    }

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200);

    await breaker.execute(() => Promise.resolve('ok'));
    expect(breaker.getState()).toBe('closed');
  });

  it('reset() method returns to closed state', async () => {
    const fail = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(fail)).rejects.toThrow();
    }
    expect(breaker.getState()).toBe('open');

    breaker.reset();
    expect(breaker.getState()).toBe('closed');
  });
});
