'use client';

import { ConnectWallet } from '@coinbase/onchainkit/wallet';

interface WalletWrapperProps {
  className?: string;
  text?: string;
}

export default function WalletWrapper({ className = '', text = 'Connect Wallet' }: WalletWrapperProps) {
  return (
    <div className={className}>
      <ConnectWallet text={text} />
    </div>
  );
}
