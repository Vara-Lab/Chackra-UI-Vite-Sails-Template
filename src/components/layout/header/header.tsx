import React from 'react';
import { Logo } from './logo';
import { AccountInfo } from './account-info';
import styles from './header.module.scss';
import { MultiWallet } from '@/features/multiwallet/ui/wallet';

type Props = {
  isAccountVisible: boolean;
};

export function Header({ isAccountVisible }: Props) {
  // const [isMenuOpen] = React.useState(false);

  return (
    <header className={styles.header}>
      <Logo />
      
      {isAccountVisible && <MultiWallet/>}
    </header>
  );

  
}
