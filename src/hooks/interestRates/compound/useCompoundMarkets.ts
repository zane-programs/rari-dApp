import { useEffect, useState, useRef } from "react";

// Hooks
import { useRari } from "context/RariContext";

// ABIs
import Comptroller from "./Comptroller";
import CErc20 from "./CErc20";

// Types
import { MarketInfo } from "../types";

// Util/Misc
import BigNumber from "bignumber.js";
import { ETH_TOKEN_DATA } from "hooks/useTokenData";

type CTokenData = {
  cTokenAddress: string; // address of underlying token
  marketInfo: MarketInfo;
};

export default function useCompoundMarkets() {
  const { rari } = useRari();

  // holds all cToken markets
  const [markets, setMarkets] = useState<MarketInfo[]>([]);

  // ref for refresh interval
  const refreshInterval = useRef<number | null>(null);

  useEffect(() => {
    const comptroller = new rari.web3.eth.Contract(
      Comptroller.abi,
      Comptroller.address
    );

    async function getMarkets() {
      // get all markets from Comptroller
      const cTokenMarketList: string[] = await comptroller.methods
        .getAllMarkets()
        .call();

      // asynchronously fetch list of underlying tokens and supply/borrow rates
      const marketData: CTokenData[] = [];
      await Promise.all(
        cTokenMarketList.map(async (cTokenAddress) => {
          const cToken = new rari.web3.eth.Contract(CErc20.abi, cTokenAddress);

          const symbol: string = await cToken.methods.symbol().call();
          const supplyRate: number = await cToken.methods
            .supplyRatePerBlock()
            .call();
          const borrowRate: number = await cToken.methods
            .borrowRatePerBlock()
            .call();
          // for cETH, return dummy ETH "address" (0x000000...)
          // otherwise, use address from underlying()
          const underlyingAddress: string =
            symbol === "cETH"
              ? ETH_TOKEN_DATA.address
              : ((await cToken.methods.underlying().call()) as string);

          // add underlying token address & lend/borrow rates to list
          marketData.push({
            cTokenAddress, // address of original cToken
            marketInfo: {
              tokenAddress: underlyingAddress,
              rates: {
                lending: new BigNumber(convertRatePerBlockToAPY(supplyRate)),
                borrowing: new BigNumber(convertRatePerBlockToAPY(borrowRate)),
              },
            },
          });
        })
      );

      // sort market data according to Comptroller cToken list
      marketData.sort(
        (a, b) =>
          cTokenMarketList.indexOf(a.cTokenAddress) -
          cTokenMarketList.indexOf(b.cTokenAddress)
      );

      // set markets in state
      setMarkets(marketData.map((data) => data.marketInfo));
    }

    getMarkets().then(() => {
      refreshInterval.current = window.setInterval(getMarkets, 5000);
    });

    // clear refreshInterval on unmount (if initialized)
    return () => {
      window.clearInterval(refreshInterval.current || -1);
    };
  }, [rari.web3]);

  return markets;
}

// rate expressed in mantissa
function convertRatePerBlockToAPY(rate: number) {
  // Compound uses 6570 blocks per day:
  // (see https://compound.finance/docs#protocol-math)
  return (1 + (rate * 6570) / 1e18) ** 365 - 1;
}
