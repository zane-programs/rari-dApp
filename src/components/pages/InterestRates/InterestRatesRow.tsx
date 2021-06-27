import { useMemo, useState } from "react";
import { useContext } from "react";

import {
  InterestRatesContext,
  InterestRatesTableOptions,
} from "./InterestRatesView";

// Components
import { motion } from "framer-motion";
import { Box, Image, Spinner, Tr, Td } from "@chakra-ui/react";

// Utils
import BigNumber from "bignumber.js";

// Types
import { TokenData } from "hooks/useTokenData";

export default function InterestRatesRow({
  assetAddress,
}: {
  assetAddress: string;
}) {
  const { markets, tokens } = useContext(InterestRatesContext);

  // information about this particular token or asset
  const asset = useMemo(
    () => tokens?.find((token) => token.address === assetAddress),
    [tokens]
  );

  // market data from Aave
  const aave = useMemo(
    () => markets.aave.find((reserve) => reserve.tokenAddress === assetAddress),
    [markets.aave]
  );

  // market data from Aave
  const compound = useMemo(
    () =>
      markets.compound.find((market) => market.tokenAddress === assetAddress),
    [markets.compound]
  );

  return (
    <Tr>
      <Td fontWeight="bold">
        <AssetTitle asset={asset} />
      </Td>
      {/* Compound */}
      <Td textAlign="center">
        <AnimatedPercentage
          lendingRate={compound?.rates.lending}
          borrowingRate={compound?.rates.borrowing}
        />
      </Td>
      {/* Aave */}
      <Td textAlign="center">
        <AnimatedPercentage
          lendingRate={aave?.rates.lending}
          borrowingRate={aave?.rates.borrowing}
        />
      </Td>
      {/* Fuse P1 */}
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={null} borrowingRate={null} />
      </Td>
      {/* Fuse P2 */}
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={null} borrowingRate={null} />
      </Td>
    </Tr>
  );
}

function AnimatedPercentage({
  lendingRate,
  borrowingRate,
}: {
  lendingRate: BigNumber | null | undefined;
  borrowingRate: BigNumber | null | undefined;
}) {
  const { selectedTable, marketDataLoaded } = useContext(InterestRatesContext);

  return !lendingRate || !borrowingRate ? (
    // show Spinner if values not yet loaded, otherwise show dash
    <>{marketDataLoaded ? "\u2013" : <Spinner size="xs" />}</>
  ) : (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ ease: "easeOut", duration: 0.25 }}
      style={{ position: "relative" }}
      // had to add key prop for framer-motion to animate
      key={selectedTable}
    >
      {formatPercentageBN(
        selectedTable === InterestRatesTableOptions.Lending
          ? lendingRate
          : borrowingRate
      )}
    </motion.div>
  );
}

function AssetTitle({ asset }: { asset?: TokenData }) {
  const [hasLogoLoaded, setHasLogoLoaded] = useState(false);

  return asset ? (
    // show asset title Name (Symbol)
    <>
      <Spinner size="xs" hidden={hasLogoLoaded} />
      <Box hidden={!hasLogoLoaded}>
        <Image
          src={asset?.logoURL}
          borderRadius="full"
          boxSize="18px"
          display="inline-block"
          mr="6px"
          // shift icons up 1px (looked awkward otherwise)
          position="relative"
          transform="translateY(-1px)"
          onLoad={() => setHasLogoLoaded(true)}
        />
        {asset?.name} ({asset?.symbol})
      </Box>
    </>
  ) : (
    // no data yet, so show spinner
    <Spinner size="xs" />
  );
}

// format percentage with 2 decimal places
const formatPercentageBN = (rate: BigNumber) =>
  rate.times(100).toFixed(2) + "%";
