export interface StopAction {
  action: 'move_stop' | 'exit' | 'hold';
  newStopPrice?: number;
  reason?: string;
  activateTrailing?: boolean;
}

interface PositionInfo {
  averageEntry: number;
  stopLoss: number;
  target: number;
  trailingStopActive: boolean;
  trailingStopPrice?: number;
}

export class TrailingStopManager {
  /**
   * Evaluate stop-loss logic for a position.
   *
   * Stage 1: If price >= entry * 1.05 and trailing not active, move stop to breakeven and activate trailing.
   * Stage 2: If trailing active and EMA20 > current trailing stop, move stop up to EMA20.
   * Then check exit conditions: price <= effective stop or price >= target.
   * Otherwise hold.
   */
  evaluateStop(
    position: PositionInfo,
    currentPrice: number,
    currentEma20: number,
  ): StopAction {
    const { averageEntry, stopLoss, target, trailingStopActive, trailingStopPrice } = position;

    let effectiveStop = trailingStopActive && trailingStopPrice != null
      ? trailingStopPrice
      : stopLoss;

    // Stage 1: Activate trailing stop at breakeven when price is 5% above entry
    if (!trailingStopActive && currentPrice >= averageEntry * 1.05) {
      effectiveStop = averageEntry;

      // Check exit conditions with the new effective stop before returning move_stop
      if (currentPrice <= effectiveStop) {
        return {
          action: 'exit',
          reason: 'Price hit breakeven stop after trailing activation',
        };
      }

      if (currentPrice >= target) {
        return {
          action: 'exit',
          reason: 'Target reached',
        };
      }

      return {
        action: 'move_stop',
        newStopPrice: averageEntry,
        reason: 'Moving stop to breakeven, activating trailing stop',
        activateTrailing: true,
      };
    }

    // Stage 2: Trail stop up to EMA20 when it exceeds current trailing stop
    if (trailingStopActive && currentEma20 > effectiveStop) {
      effectiveStop = currentEma20;

      // Check exit conditions with the new effective stop
      if (currentPrice <= effectiveStop) {
        return {
          action: 'exit',
          reason: 'Price hit trailing EMA20 stop',
        };
      }

      if (currentPrice >= target) {
        return {
          action: 'exit',
          reason: 'Target reached',
        };
      }

      return {
        action: 'move_stop',
        newStopPrice: currentEma20,
        reason: 'Trailing stop moved up to EMA20',
      };
    }

    // Check exit: price at or below effective stop
    if (currentPrice <= effectiveStop) {
      return {
        action: 'exit',
        reason: 'Stop loss hit',
      };
    }

    // Check exit: price at or above target
    if (currentPrice >= target) {
      return {
        action: 'exit',
        reason: 'Target reached',
      };
    }

    return { action: 'hold' };
  }
}
