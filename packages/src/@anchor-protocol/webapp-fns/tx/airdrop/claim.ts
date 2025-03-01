import { HumanAddr, Rate, uUST } from '@anchor-protocol/types';
import { pipe } from '@rx-stream/pipe';
import { NetworkInfo, TxResult } from '@terra-dev/wallet-types';
import {
  CreateTxOptions,
  MsgExecuteContract,
  StdFee,
} from '@terra-money/terra.js';
import {
  MantleFetch,
  TxResultRendering,
  TxStreamPhase,
} from '@terra-money/webapp-fns';
import { Observable } from 'rxjs';
import { Airdrop } from '../../queries/airdrop/check';
import { _catchTxError } from '../internal/_catchTxError';
import { _createTxOptions } from '../internal/_createTxOptions';
import { _pollTxInfo } from '../internal/_pollTxInfo';
import { _postTx } from '../internal/_postTx';
import { TxHelper } from '../internal/TxHelper';

export function airdropClaimTx($: {
  airdrop: Airdrop;
  walletAddress: HumanAddr;
  airdropContract: HumanAddr;
  gasFee?: uUST<number>;
  gasAdjustment: Rate<number>;
  txFee?: uUST;
  network: NetworkInfo;
  mantleEndpoint: string;
  mantleFetch: MantleFetch;
  post: (tx: CreateTxOptions) => Promise<TxResult>;
  txErrorReporter?: (error: unknown) => string;
  onTxSucceed?: () => void;
}): Observable<TxResultRendering> {
  const gasFee = $.gasFee ?? 300000;
  const txFee = $.txFee ?? ('50000' as uUST);

  const helper = new TxHelper({ ...$, txFee });

  return pipe(
    _createTxOptions({
      msgs: [
        new MsgExecuteContract($.walletAddress, $.airdropContract, {
          claim: {
            stage: $.airdrop.stage,
            amount: $.airdrop.amount.toString(),
            proof: JSON.parse($.airdrop.proof),
          },
        }),
      ],
      fee: new StdFee(gasFee, txFee + 'uusd'),
      gasAdjustment: $.gasAdjustment,
    }),
    _postTx({ helper, ...$ }),
    _pollTxInfo({ helper, ...$ }),
    () => {
      try {
        return {
          value: null,

          phase: TxStreamPhase.SUCCEED,
          receipts: [helper.txHashReceipt()],
        } as TxResultRendering;
      } catch (error) {
        return helper.failedToParseTxResult();
      }
    },
  )().pipe(_catchTxError({ helper, ...$ }));
}
