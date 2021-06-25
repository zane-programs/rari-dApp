import { useEffect, useRef, useState } from "react";

// Hooks
import { useRari } from "context/RariContext";
import { fetchTokenData, ETH_TOKEN_DATA } from "hooks/useTokenData";

// ABIs
import CErc20 from "./CErc20";

type CTokenInfo = {
  supplyRate: number;
  borrowRate: number;
  underlyingAddress: string;
};

export default function useCToken(cTokenAddress: string) {
  const { rari } = useRari();

  const [tokenInfo, setTokenInfo] = useState<CTokenInfo | null>(null);

  // ref for refresh interval
  const refreshInterval = useRef<number | null>(null);

  useEffect(() => {
    const cToken = new rari.web3.eth.Contract(CErc20.abi, cTokenAddress);

    async function getCTokenInfo() {
      const tokenSymbol = await cToken.methods.symbol().call();
      const supplyRate = await cToken.methods.supplyRatePerBlock().call();
      const borrowRate = await cToken.methods.borrowRatePerBlock().call();

      setTokenInfo({
        supplyRate: convertRatePerBlockToAPY(supplyRate),
        borrowRate: convertRatePerBlockToAPY(borrowRate),
        // for cETH, use special address instead of underlying()
        underlyingAddress:
          tokenSymbol === "cETH"
            ? ETH_TOKEN_DATA.address
            : await cToken.methods.underlying().call(),
      });
    }

    // fetch cToken info, then start refresh interval
    getCTokenInfo().then(() => {
      refreshInterval.current = window.setInterval(getCTokenInfo, 5000);
    });

    // clear refreshInterval on unmount (if initialized)
    return () => {
      window.clearInterval(refreshInterval.current || -1);
    };
  }, [rari.web3, cTokenAddress]);

  return tokenInfo;
}

// rate expressed in mantissa
function convertRatePerBlockToAPY(rate: number) {
  // 6570 blocks per day (see https://compound.finance/docs#protocol-math)
  return (1 + (rate * 6570) / 1e18) ** 365 - 1;
}

// cTokenAddresses.forEach(async (address) => {
//   const contract = new rari.web3.eth.Contract(CErc20.abi, address);
//   const symbol = await contract.methods.symbol().call();
//   const supplyRate = await contract.methods.supplyRatePerBlock().call();
//   const borrowRate = await contract.methods.borrowRatePerBlock().call();
// });
