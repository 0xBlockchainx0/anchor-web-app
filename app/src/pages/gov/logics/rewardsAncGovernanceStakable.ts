import type { uANC } from '@anchor-protocol/types';
import big, { Big, BigSource } from 'big.js';

export function rewardsAncGovernanceStakable(
  ancBalance: uANC<BigSource> | undefined,
): uANC<Big> | undefined {
  return ancBalance ? (big(ancBalance) as uANC<Big>) : undefined;
}
