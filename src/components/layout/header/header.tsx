import { Logo } from './logo';
import { Wallet } from '@gear-js/wallet-connect';
import styles from './header.module.scss';

interface Props {
  isAccountVisible: boolean;
};

export function Header({ isAccountVisible }: Props) {
  return (
    <header className={styles.header}>
      <Logo />
      {isAccountVisible && <Wallet theme='vara'/>}
      
    </header>
  );

  
}
