/**
 * Portfolio math — shared calculations for P&L, allocation, and position values.
 */

import type { Position, PriceData } from './types';

export interface PositionValue {
  position: Position;
  currentPrice: number;
  confidence: number;
  /** Current market value = quantity * currentPrice */
  marketValue: number;
  /** Cost basis = quantity * avgCostBasis (null if no cost basis set) */
  costBasis: number | null;
  /** Unrealized P&L in dollars (null if no cost basis) */
  pnl: number | null;
  /** Unrealized P&L as percentage (null if no cost basis) */
  pnlPct: number | null;
}

export interface PortfolioSummary {
  /** Total current market value */
  totalValue: number;
  /** Total cost basis (null if any position missing cost basis) */
  totalCostBasis: number | null;
  /** Total unrealized P&L (null if any position missing cost basis) */
  totalPnl: number | null;
  /** Total P&L percentage (null if no cost basis) */
  totalPnlPct: number | null;
  /** Allocation breakdown by position */
  allocations: { feedId: string; symbol: string; pct: number }[];
  /** Number of positions */
  positionCount: number;
}

/**
 * Calculate current value for a single position.
 */
export function calculatePositionValue(
  position: Position,
  priceData: PriceData | null,
): PositionValue {
  const currentPrice = priceData?.price ?? 0;
  const confidence = priceData?.confidence ?? 0;
  const marketValue = position.quantity * currentPrice;

  let costBasis: number | null = null;
  let pnl: number | null = null;
  let pnlPct: number | null = null;

  if (position.avgCostBasis !== null) {
    costBasis = position.quantity * position.avgCostBasis;
    pnl = marketValue - costBasis;
    pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : null;
  }

  return { position, currentPrice, confidence, marketValue, costBasis, pnl, pnlPct };
}

/**
 * Calculate portfolio summary from all position values.
 */
export function calculatePortfolioSummary(
  positionValues: PositionValue[],
): PortfolioSummary {
  const totalValue = positionValues.reduce((sum, pv) => sum + pv.marketValue, 0);

  // Cost basis: only valid if ALL positions have it
  const allHaveCostBasis = positionValues.every((pv) => pv.costBasis !== null);
  const totalCostBasis = allHaveCostBasis
    ? positionValues.reduce((sum, pv) => sum + (pv.costBasis ?? 0), 0)
    : null;

  const totalPnl = totalCostBasis !== null ? totalValue - totalCostBasis : null;
  const totalPnlPct =
    totalPnl !== null && totalCostBasis !== null && totalCostBasis > 0
      ? (totalPnl / totalCostBasis) * 100
      : null;

  const allocations = positionValues.map((pv) => ({
    feedId: pv.position.feedId,
    symbol: pv.position.symbol,
    pct: totalValue > 0 ? (pv.marketValue / totalValue) * 100 : 0,
  }));

  return {
    totalValue,
    totalCostBasis,
    totalPnl,
    totalPnlPct,
    allocations,
    positionCount: positionValues.length,
  };
}

/**
 * Recalculate weighted average cost basis after a new transaction.
 */
export function recalculateCostBasis(
  currentQuantity: number,
  currentAvgCost: number | null,
  txnQuantity: number,
  txnPrice: number,
  txnType: 'buy' | 'sell',
): { newQuantity: number; newAvgCost: number | null } {
  if (txnType === 'buy') {
    const newQuantity = currentQuantity + txnQuantity;
    const oldTotal = currentQuantity * (currentAvgCost ?? 0);
    const txnTotal = txnQuantity * txnPrice;
    const newAvgCost = newQuantity > 0 ? (oldTotal + txnTotal) / newQuantity : null;
    return { newQuantity, newAvgCost };
  }

  // Sell: quantity decreases, avg cost stays the same (FIFO simplification)
  const newQuantity = Math.max(0, currentQuantity - txnQuantity);
  return { newQuantity, newAvgCost: newQuantity > 0 ? currentAvgCost : null };
}
