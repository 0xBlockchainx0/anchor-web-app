import {
  AddressProvider,
  fabricateMarketRepay,
} from '@anchor-protocol/anchor.js';
import {
  demicrofy,
  formatRate,
  formatUSTWithPostfixUnits,
} from '@anchor-protocol/notation';
import { Rate, uUST } from '@anchor-protocol/types';
import { pipe } from '@rx-stream/pipe';
import { floor } from '@terra-dev/big-math';
import { NetworkInfo, TxResult } from '@terra-dev/wallet-types';
import { CreateTxOptions, StdFee } from '@terra-money/terra.js';
import {
  MantleFetch,
  pickAttributeValue,
  pickEvent,
  pickRawLog,
  TxResultRendering,
  TxStreamPhase,
} from '@terra-money/webapp-fns';
import { QueryObserverResult } from 'react-query';
import { Observable } from 'rxjs';
import { computeCurrentLtv } from '../../computes/borrow/computeCurrentLtv';
import { BorrowBorrower } from '../../queries/borrow/borrower';
import { BorrowMarket } from '../../queries/borrow/market';
import { _catchTxError } from '../internal/_catchTxError';
import { _createTxOptions } from '../internal/_createTxOptions';
import { _pollTxInfo } from '../internal/_pollTxInfo';
import { _postTx } from '../internal/_postTx';
import { TxHelper } from '../internal/TxHelper';
import { _fetchBorrowData } from './_fetchBorrowData';

export function borrowRepayTx(
  $: Parameters<typeof fabricateMarketRepay>[0] & {
    gasFee: uUST<number>;
    gasAdjustment: Rate<number>;
    txFee: uUST;
    network: NetworkInfo;
    addressProvider: AddressProvider;
    mantleEndpoint: string;
    mantleFetch: MantleFetch;
    post: (tx: CreateTxOptions) => Promise<TxResult>;
    txErrorReporter?: (error: unknown) => string;
    borrowMarketQuery: () => Promise<
      QueryObserverResult<BorrowMarket | undefined>
    >;
    borrowBorrowerQuery: () => Promise<
      QueryObserverResult<BorrowBorrower | undefined>
    >;
    onTxSucceed?: () => void;
  },
): Observable<TxResultRendering> {
  const helper = new TxHelper($);

  return pipe(
    _createTxOptions({
      msgs: fabricateMarketRepay($)($.addressProvider),
      fee: new StdFee($.gasFee, floor($.txFee) + 'uusd'),
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    _fetchBorrowData({ helper, ...$ }),
    ({ value: { txInfo, borrowMarket, borrowBorrower } }) => {
      if (!borrowMarket || !borrowBorrower) {
        return helper.failedToCreateReceipt(
          new Error('Failed to load borrow data'),
        );
      }

      const rawLog = pickRawLog(txInfo, 0);

      if (!rawLog) {
        return helper.failedToFindRawLog();
      }

      const fromContract = pickEvent(rawLog, 'from_contract');

      if (!fromContract) {
        return helper.failedToFindEvents('from_contract');
      }

      try {
        const repaidAmount = pickAttributeValue<uUST>(fromContract, 3);

        const newLtv =
          computeCurrentLtv(
            borrowBorrower.marketBorrowerInfo,
            borrowBorrower.custodyBorrower,
            borrowMarket.oraclePrice,
          ) ?? ('0' as Rate);

        const outstandingLoan = borrowBorrower.marketBorrowerInfo.loan_amount;

        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [
            repaidAmount && {
              name: 'Repaid Amount',
              value:
                formatUSTWithPostfixUnits(demicrofy(repaidAmount)) + ' UST',
            },
            newLtv && {
              name: 'New LTV',
              value: formatRate(newLtv) + ' %',
            },
            outstandingLoan && {
              name: 'Outstanding Loan',
              value:
                formatUSTWithPostfixUnits(demicrofy(outstandingLoan)) + ' UST',
            },
            helper.txHashReceipt(),
            helper.txFeeReceipt(),
          ],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    },
  )().pipe(_catchTxError({ helper, ...$ }));
}
