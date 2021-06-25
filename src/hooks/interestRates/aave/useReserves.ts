import { useEffect, useRef, useState } from "react";

// Hooks
import { useRari } from "context/RariContext";

// ABIs
import LendingPool from "./LendingPool";

// Utils
import BigNumber from "bignumber.js";
import Web3 from "web3";

type InterestRatesType = {
  lending: BigNumber;
  borrowing: BigNumber;
};

export type AaveMarketInfo = {
  tokenAddress: string;
  rates: InterestRatesType;
};

export default function useReserves() {
  const { rari } = useRari();

  // state for reserves (list & borrowing/lending rate data)
  const [reserves, setReserves] = useState<AaveMarketInfo[]>([]);

  // ref for refresh interval
  const refreshInterval = useRef<number | null>(null);

  useEffect(() => {
    const contract = new rari.web3.eth.Contract(
      LendingPool.abi,
      LendingPool.address
    );

    // fetch list of token addresses
    async function getReserves() {
      // get list of token addresses
      const tokenList: string[] = await contract.methods
        .getReservesList()
        .call();

      // grab reserve data asynchronously
      const reservesData: AaveMarketInfo[] = [];
      await Promise.all(
        tokenList.map(async (address) => {
          reservesData.push({
            tokenAddress: address,
            rates: await fetchReserveData(address, rari.web3),
          });
        })
      );

      // sort reserves according to tokenList order
      reservesData.sort(
        (a, b) =>
          tokenList.indexOf(a.tokenAddress) - tokenList.indexOf(b.tokenAddress)
      );

      setReserves(reservesData);
    }

    getReserves().then(() => {
      refreshInterval.current = window.setInterval(getReserves, 5000);
    });

    // clear refreshInterval on unmount (if initialized)
    return () => {
      window.clearInterval(refreshInterval.current || -1);
    };
  }, [rari.web3, setReserves]);

  return reserves;
}

async function fetchReserveData(
  assetAddress: string,
  web3: Web3
): Promise<InterestRatesType> {
  // init LendingPool
  const contract = new web3.eth.Contract(LendingPool.abi, LendingPool.address);

  // get reserve data from LendingPool
  const reserveData = await contract.methods
    .getReserveData(assetAddress)
    .call();

  // get lending and borrowing rates (converting from ray [1e27])
  const lendingRate = new BigNumber(reserveData.currentLiquidityRate).dividedBy(
    "1e27"
  );
  const borrowingRate = new BigNumber(
    reserveData.currentVariableBorrowRate
  ).dividedBy("1e27");

  return { lending: lendingRate, borrowing: borrowingRate };
}
