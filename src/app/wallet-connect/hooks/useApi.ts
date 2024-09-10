import { useState, useEffect } from "react";
import { GearApi  } from '@gear-js/api';

export const useApi = () => {
  const [api, setApi] = useState<any | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApi = async () => {
      try {
        const apiInstance = await GearApi.create({
            providerAddress: 'wss://testnet.vara.network',
          });
        await apiInstance.isReady;
        setApi(apiInstance);
        setIsReady(true);
      } catch (err: any) {
        setError(err.message);
      }
    };

    initializeApi();
  }, []);

  return { api, isReady, error };
};
