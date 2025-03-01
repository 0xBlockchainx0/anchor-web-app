import { Timeout, UserDenied } from '@terra-dev/wallet-types';
import { TxResultRendering, TxStreamPhase } from '@terra-money/webapp-fns';
import { OperatorFunction } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TxHelper } from './TxHelper';

interface Params {
  helper: TxHelper;
  txErrorReporter?: (error: unknown) => string;
}

export function _catchTxError({
  helper,
  txErrorReporter,
}: Params): OperatorFunction<any, any> {
  return catchError((error) => {
    const errorId =
      txErrorReporter &&
      !(error instanceof UserDenied || error instanceof Timeout)
        ? txErrorReporter(error)
        : undefined;

    return Promise.resolve<TxResultRendering>({
      value: null,

      phase: TxStreamPhase.FAILED,
      failedReason: { error, errorId },
      receipts: [helper.txHashReceipt()],
    });
  });
}
