import { formatRate } from '@anchor-protocol/notation';
import { Rate } from '@anchor-protocol/types';
import { useAnchorWebapp } from '@anchor-protocol/webapp-provider';
import { useConnectedWallet } from '@terra-money/wallet-provider';
import { useTerraWebapp } from '@terra-money/webapp-provider';
import big from 'big.js';
import { useNotification } from 'contexts/notification';
import { useCallback, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { userLtvQuery } from './userLtv';

export interface LiquidationAlert {
  enabled: boolean;
  ratio: number;
}

export function useLiquidationAlert({ enabled, ratio }: LiquidationAlert) {
  const { mantleEndpoint, mantleFetch } = useTerraWebapp();
  const { contractAddress: address } = useAnchorWebapp();
  const connectedWallet = useConnectedWallet();
  const { permission, create } = useNotification();

  const history = useHistory();

  const jobCallback = useCallback(async () => {
    if (!connectedWallet || permission !== 'granted') {
      return;
    }

    try {
      const ltv = await userLtvQuery({
        walletAddress: connectedWallet.walletAddress,
        mantleFetch,
        mantleEndpoint,
        address,
      });

      if (big(ltv).gte(ratio)) {
        const noti = create(`LTV is ${formatRate(ltv as Rate)}%`, {
          body: `Lower borrow LTV on Anchor webapp to prevent liquidation.`,
          icon: '/logo.png',
        });

        if (noti) {
          const click = () => {
            history.push('/borrow');
          };

          noti.addEventListener('click', click);

          setTimeout(() => {
            noti.removeEventListener('click', click);
          }, 1000 * 10);
        }
      }
    } catch {}
  }, [
    address,
    connectedWallet,
    create,
    history,
    mantleEndpoint,
    mantleFetch,
    permission,
    ratio,
  ]);

  const jobCallbackRef = useRef(jobCallback);

  useEffect(() => {
    jobCallbackRef.current = jobCallback;
  }, [jobCallback]);

  useEffect(() => {
    if (connectedWallet && permission === 'granted' && enabled) {
      //console.log('LIQUIDATION ALERT: ON');
      const intervalId = setInterval(() => {
        jobCallbackRef.current();
      }, 1000 * 60);

      jobCallbackRef.current();

      return () => {
        clearInterval(intervalId);
      };
    }
    //console.log('LIQUIDATION ALERT: OFF');
  }, [connectedWallet, enabled, permission]);
}
