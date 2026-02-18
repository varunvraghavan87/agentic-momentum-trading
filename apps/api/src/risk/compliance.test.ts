import type { OrderParams } from '@amt/shared';
import { SEBICompliance } from './compliance';

describe('SEBICompliance', () => {
  let compliance: SEBICompliance;

  beforeEach(() => {
    compliance = new SEBICompliance();
  });

  describe('getAlgoTag', () => {
    it('should return AMT001', () => {
      expect(compliance.getAlgoTag()).toBe('AMT001');
    });
  });

  describe('validateOrder', () => {
    const baseOrder: OrderParams = {
      tradingsymbol: 'INFY',
      exchange: 'NSE',
      transactionType: 'BUY',
      orderType: 'LIMIT',
      product: 'CNC',
      quantity: 10,
      price: 100,
    };

    it('should return valid for a valid LIMIT order', () => {
      const result = compliance.validateOrder(baseOrder);
      expect(result).toEqual({ valid: true });
    });

    it('should return invalid when quantity is 0', () => {
      const result = compliance.validateOrder({ ...baseOrder, quantity: 0 });
      expect(result.valid).toBe(false);
    });

    it('should return invalid for LIMIT order with no price', () => {
      const result = compliance.validateOrder({
        ...baseOrder,
        orderType: 'LIMIT',
        price: undefined,
      });
      expect(result.valid).toBe(false);
    });

    it('should return valid for MARKET order with no price', () => {
      const result = compliance.validateOrder({
        ...baseOrder,
        orderType: 'MARKET',
        price: undefined,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe('throttle', () => {
    it('should resolve without throwing', async () => {
      await expect(compliance.throttle()).resolves.toBeUndefined();
    });
  });
});
