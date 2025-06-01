
import { useState, useEffect } from 'react';

export const useETHPrice = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchETHPrice = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(3500); // Fallback price
      } finally {
        setIsLoading(false);
      }
    };

    fetchETHPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchETHPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { ethPrice, isLoading };
};
