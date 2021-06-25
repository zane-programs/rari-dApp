import { useEffect, useState } from "react";

// Hooks
import { useRari } from "context/RariContext";
import AaveLendingPool from "./LendingPool";

export default function useReservesList() {
  const { rari } = useRari();

  const [reservesList, setReservesList] = useState<string[]>([]);

  useEffect(() => {
    const contract = new rari.web3.eth.Contract(
      AaveLendingPool.abi,
      AaveLendingPool.address
    );

    // fetch list of token addresses
    async function getReservesList() {
      const list = await contract.methods.getReservesList().call();
      setReservesList(list);
    }

    getReservesList();
  }, [rari.web3, setReservesList]);

  return reservesList;
}
