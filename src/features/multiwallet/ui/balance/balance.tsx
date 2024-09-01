import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  useAccountDeriveBalancesAll,
  useApi,
  useBalanceFormat,
} from "@gear-js/react-hooks";

const Balance = () => {
  const { isApiReady } = useApi();
  const balances = useAccountDeriveBalancesAll();
  const { getFormattedBalance } = useBalanceFormat();

  const formattedBalance =
    isApiReady && balances
      ? getFormattedBalance(balances.freeBalance)
      : undefined;

  return formattedBalance ? (
    <section>
      <Text  size="xl">
        <span>{formattedBalance.value}</span>
        <span>{formattedBalance.unit}</span>
      </Text >
    </section>
  ) : null;
};

export { Balance };
