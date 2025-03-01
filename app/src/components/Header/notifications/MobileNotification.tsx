import { useWallet, WalletStatus } from '@terra-money/wallet-provider';
import { ReactComponent as NotificationOff } from 'components/Header/assets/NotificationOff.svg';
import { ReactComponent as NotificationOn } from 'components/Header/assets/NotificationOn.svg';
import { useNotificationDialog } from 'components/Header/notifications/useNotificationDialog';
import { useNotification } from 'contexts/notification';
import { useJobs } from 'jobs/Jobs';
import React, { useMemo } from 'react';
import styled from 'styled-components';

export interface MobileNotificationProps {
  className?: string;
}

function MobileNotificationBase({ className }: MobileNotificationProps) {
  const { status } = useWallet();
  const { permission } = useNotification();
  const { liquidationAlert } = useJobs();

  const [openDialog, dialogElement] = useNotificationDialog();

  const visible = useMemo(() => {
    return status === WalletStatus.WALLET_CONNECTED && permission === 'granted';
  }, [permission, status]);

  return visible ? (
    <div className={className} data-enabled={liquidationAlert.enabled}>
      <div onClick={() => openDialog({})} className="notification-icon">
        {liquidationAlert.enabled ? <NotificationOn /> : <NotificationOff />}
      </div>
      {dialogElement}
    </div>
  ) : null;
}

export const MobileNotification = styled(MobileNotificationBase)`
  svg {
    width: 47px;

    transform: translateY(-2px);

    cursor: pointer;

    color: #666666;

    &:hover {
      color: #999999;
    }
  }

  &[data-enabled='true'] {
    svg {
      color: ${({ theme }) => theme.colors.positive};
    }
  }
`;
