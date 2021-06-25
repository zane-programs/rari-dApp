import { useEffect, useRef, useState } from "react";

// Utils
import BigNumber from "bignumber.js";

// Hooks
import { useRari } from "context/RariContext";
import LendingPool from "./LendingPool";

export default function useReserveData(assetAddress: string) {
  const { rari } = useRari();

  // state for lending & borrowing rates
  const [lendingRate, setLendingRate] = useState<BigNumber | null>(null);
  const [borrowingRate, setBorrowingRate] = useState<BigNumber | null>(null);

  // ref for refresh interval
  const refreshInterval = useRef<number | null>(null);

  useEffect(() => {
    const contract = new rari.web3.eth.Contract(
      LendingPool.abi,
      LendingPool.address
    );

    async function getRates() {
      const reserveData = await contract.methods
        .getReserveData(assetAddress)
        .call();

      const lending = new BigNumber(reserveData.currentLiquidityRate).dividedBy(
        "1e27"
      );
      const borrowing = new BigNumber(
        reserveData.currentVariableBorrowRate
      ).dividedBy("1e27");

      // set rates in state
      setLendingRate(lending);
      setBorrowingRate(borrowing);
    }

    getRates().then(() => {
      refreshInterval.current = window.setInterval(getRates, 5000);
    });

    // clear refreshInterval on unmount (if initialized)
    return () => {
      window.clearInterval(refreshInterval.current || -1);
    };
  }, [rari.web3, assetAddress]);

  return { lendingRate, borrowingRate };
}
