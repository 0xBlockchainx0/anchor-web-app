import { moneyMarket, Rate, uUST } from '@anchor-protocol/types';
import {
  mantle,
  MantleParams,
  WasmQuery,
  WasmQueryData,
} from '@terra-money/webapp-fns';
import big from 'big.js';
import { ANCHOR_SAFE_RATIO } from '../../env';

export interface BorrowMarketWasmQuery {
  marketState: WasmQuery<
    moneyMarket.market.State,
    moneyMarket.market.StateResponse
  >;
  borrowRate: WasmQuery<
    moneyMarket.interestModel.BorrowRate,
    moneyMarket.interestModel.BorrowRateResponse
  >;
  oraclePrice: WasmQuery<
    moneyMarket.oracle.Price,
    moneyMarket.oracle.PriceResponse
  >;
  overseerWhitelist: WasmQuery<
    moneyMarket.overseer.Whitelist,
    moneyMarket.overseer.WhitelistResponse
  >;
}

export interface BorrowMarketStateQueryVariables {
  marketContract: string;
}

export interface BorrowMarketStateQueryResult {
  marketBalances: {
    Result: { Denom: string; Amount: string }[];
  };
}

export type BorrowMarket = WasmQueryData<BorrowMarketWasmQuery> & {
  marketBalances: {
    uUST: uUST;
  };

  bLunaMaxLtv?: Rate;
  bLunaSafeLtv?: Rate;
};

// language=graphql
export const BORROW_MARKET_STATE_QUERY = `
  query (
    $marketContract: String!
  ) {
    marketBalances: BankBalancesAddress(Address: $marketContract) {
      Result {
        Denom
        Amount
      }
    }
  }
`;

export type BorrowMarketQueryParams = Omit<
  MantleParams<BorrowMarketWasmQuery>,
  'query' | 'variables'
>;

export async function borrowMarketQuery({
  mantleEndpoint,
  wasmQuery,
  ...params
}: BorrowMarketQueryParams): Promise<BorrowMarket> {
  type MarketStateWasmQuery = Pick<BorrowMarketWasmQuery, 'marketState'>;
  type MarketWasmQuery = Omit<BorrowMarketWasmQuery, 'marketState'>;

  const { marketBalances: _marketBalances, marketState } = await mantle<
    MarketStateWasmQuery,
    BorrowMarketStateQueryVariables,
    BorrowMarketStateQueryResult
  >({
    mantleEndpoint: `${mantleEndpoint}?borrow--market-states`,
    wasmQuery: {
      marketState: wasmQuery.marketState,
    },
    variables: {
      marketContract: wasmQuery.marketState.contractAddress,
    },
    query: BORROW_MARKET_STATE_QUERY,
    ...params,
  });

  const marketBalances: Pick<BorrowMarket, 'marketBalances'>['marketBalances'] =
    {
      uUST: (_marketBalances.Result.find(({ Denom }) => Denom === 'uusd')
        ?.Amount ?? '0') as uUST,
    };

  const { borrowRate, oraclePrice, overseerWhitelist } =
    await mantle<MarketWasmQuery>({
      mantleEndpoint: `${mantleEndpoint}?borrow--market`,
      variables: {},
      wasmQuery: {
        borrowRate: {
          ...wasmQuery.borrowRate,
          query: {
            borrow_rate: {
              market_balance: marketBalances.uUST,
              total_liabilities: marketState.total_liabilities,
              total_reserves: marketState.total_reserves,
            },
          },
        },
        oraclePrice: wasmQuery.oraclePrice,
        overseerWhitelist: wasmQuery.overseerWhitelist,
      },
      ...params,
    });

  const bLunaMaxLtv = overseerWhitelist.elems.find(
    ({ collateral_token }) =>
      collateral_token ===
      wasmQuery.overseerWhitelist.query.whitelist.collateral_token,
  )?.max_ltv;

  const bLunaSafeLtv = bLunaMaxLtv
    ? (big(bLunaMaxLtv).mul(ANCHOR_SAFE_RATIO).toFixed() as Rate)
    : undefined;

  return {
    marketBalances,
    marketState,
    overseerWhitelist,
    oraclePrice,
    borrowRate,
    bLunaMaxLtv,
    bLunaSafeLtv,
  };
}
