import { useEffect, useState } from "react";

// Hooks
import { useRari } from "context/RariContext";

// ABIs
import Comptroller from "./Comptroller";

export default function useAllMarkets() {
  const { rari, fuse } = useRari();

  // holds all cToken markets
  const [markets, setMarkets] = useState<string[]>([]);

  console.log(fuse.compoundContracts);

  useEffect(() => {
    const comptroller = new rari.web3.eth.Contract(
      Comptroller.abi,
      Comptroller.address
    );

    // getAllMarkets then set in state
    comptroller.methods.getAllMarkets().call().then(setMarkets);
  }, [rari.web3]);

  return markets;
}
