import { HumanAddr } from '@anchor-protocol/types';
import {
  BondValidators,
  bondValidatorsQuery,
} from '@anchor-protocol/webapp-fns';
import { createQueryFn } from '@terra-dev/react-query-utils';
import { useBrowserInactive } from '@terra-dev/use-browser-inactive';
import { MantleFetch, useTerraWebapp } from '@terra-money/webapp-provider';
import { useQuery, UseQueryResult } from 'react-query';
import { useAnchorWebapp } from '../../contexts/context';
import { ANCHOR_QUERY_KEY } from '../../env';

const queryFn = createQueryFn(
  (
    mantleEndpoint: string,
    mantleFetch: MantleFetch,
    bLunaHubContract: HumanAddr,
  ) => {
    return bondValidatorsQuery({
      mantleEndpoint,
      mantleFetch,
      wasmQuery: {
        hubWhitelistedValidators: {
          contractAddress: bLunaHubContract,
          query: {
            whitelisted_validators: {},
          },
        },
      },
    });
  },
);

export function useBondValidators(): UseQueryResult<
  BondValidators | undefined
> {
  const { mantleFetch, mantleEndpoint, queryErrorReporter } = useTerraWebapp();

  const { contractAddress } = useAnchorWebapp();

  const { browserInactive } = useBrowserInactive();

  return useQuery(
    [
      ANCHOR_QUERY_KEY.BOND_VALIDATORS,
      mantleEndpoint,
      mantleFetch,
      contractAddress.bluna.hub,
    ],
    queryFn,
    {
      refetchInterval: browserInactive && 1000 * 60 * 5,
      enabled: !browserInactive,
      keepPreviousData: true,
      onError: queryErrorReporter,
    },
  );
}
