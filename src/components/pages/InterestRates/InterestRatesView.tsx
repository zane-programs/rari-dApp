import {
  useContext,
  useEffect,
  useState,
  createContext,
  MouseEventHandler,
  ReactNode,
} from "react";

// Components
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  Heading,
  Image,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Thead,
  Td,
  Th,
  Tr,
} from "@chakra-ui/react";
import { Input, InputGroup, InputLeftElement } from "@chakra-ui/input";
import { SearchIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { Column } from "utils/chakraUtils";

// Hooks
import { TokenData, useTokenData } from "hooks/useTokenData";
// Aave
import useReserveData from "hooks/interestRates/aave/useReserveData";
import useReservesList from "hooks/interestRates/aave/useReservesList";
// Compound
// import useAllMarkets from "hooks/interestRates/compound/useAllMarkets";
// import useCToken from "hooks/interestRates/compound/useCToken";

// Utils
import BigNumber from "bignumber.js";

enum InterestRatesTableOptions {
  Lending = "lending",
  Borrowing = "borrowing",
}

const InterestRatesContext = createContext<InterestRatesTableOptions>(
  InterestRatesTableOptions.Lending
);

export default function InterestRatesView() {
  // name of table in view (current)
  const [tableName, setTableName] = useState<InterestRatesTableOptions>(
    InterestRatesTableOptions.Lending
  );

  // Aave
  const reservesList = useReservesList();

  return (
    <InterestRatesContext.Provider value={tableName}>
      <Column
        width="100%"
        mainAxisAlignment="center"
        crossAxisAlignment="flex-start"
        mt="3rem"
        p={15}
      >
        {/* TODO (Zane): Add i18n */}
        <Heading size="lg" mb="5">
          Interest Rates
        </Heading>
        {reservesList.length === 0 ? (
          <Center w="100%" h="100px">
            <Spinner size="xl" />
          </Center>
        ) : (
          <>
            <Flex w="100%">
              <Box flex="1">
                <MultiPicker
                  options={{
                    lending: "Lending Rates",
                    borrowing: "Borrowing Rates",
                  }}
                  // set table on change
                  onChange={(value) =>
                    setTableName(value as InterestRatesTableOptions)
                  }
                />
              </Box>
              <Spacer flex="2" />
              <Box flex="1">
                <TokenSearch />
              </Box>
            </Flex>
            <Table mt="4">
              <Thead color="white">
                <Tr>
                  <Th color="white">Asset</Th>
                  <Th color="white" textAlign="center" fontWeight="bold">
                    Compound
                  </Th>
                  <Th color="white" textAlign="center" fontWeight="bold">
                    Aave
                  </Th>
                  <Th color="white" textAlign="center" fontWeight="bold">
                    Fuse P1
                  </Th>
                  <Th color="white" textAlign="center" fontWeight="bold">
                    Fuse P2
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {reservesList.map((tokenAddress) => (
                  <InterestRatesRow
                    assetAddress={tokenAddress}
                    key={tokenAddress}
                  />
                ))}
              </Tbody>
            </Table>
          </>
        )}
      </Column>
    </InterestRatesContext.Provider>
  );
}

// TODO (Zane): change "any" type to something else?
function MultiPicker({
  options,
  onChange,
}: {
  options: any;
  onChange: (state: string) => any;
}) {
  // start with first option as default
  const [selectedKey, setSelectedKey] = useState<string>(
    Object.keys(options)[0]
  );

  useEffect(() => {
    onChange(selectedKey);
  }, [onChange, selectedKey]);

  return (
    <ButtonGroup spacing="0" borderRadius="full" bgColor="#2D3748">
      {Object.keys(options).map((key) => (
        <MultiPickerButton
          selected={key === selectedKey}
          onClick={() => setSelectedKey(key)}
          key={key}
        >
          {options[key]}
        </MultiPickerButton>
      ))}
    </ButtonGroup>
  );
}

function MultiPickerButton({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      colorScheme="black"
      variant={selected ? "solid" : "ghost"}
      borderRadius="full"
      onClick={onClick}
      bgColor={selected ? "#00C628" : "transparent"}
    >
      {children}
    </Button>
  );
}

function InterestRatesRow({ assetAddress }: { assetAddress: string }) {
  const aave = useReserveData(assetAddress);
  const asset = useTokenData(assetAddress);

  return (
    <Tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Td fontWeight="bold">
        <AssetTitle asset={asset} />
      </Td>
      {/* Compound */}
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={null} borrowingRate={null} />
      </Td>
      {/* Aave */}
      <Td textAlign="center">
        <AnimatedPercentage
          lendingRate={aave.lendingRate}
          borrowingRate={aave.borrowingRate}
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
  lendingRate: BigNumber | null;
  borrowingRate: BigNumber | null;
}) {
  const selectedTable = useContext(InterestRatesContext);

  return lendingRate === null || borrowingRate === null ? (
    // show Spinner if values not yet loaded
    <Spinner size="xs" />
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

function TokenSearch(props: any) {
  const [val, setVal] = useState("");
  return (
    <Box {...props}>
      <InputGroup>
        <InputLeftElement
          pointerEvents="none"
          children={<SearchIcon color="#757575" />}
        />
        <Input
          variant="filled"
          value={val}
          onChange={({ target: { value } }) => setVal(value)}
          placeholder="Search Assets"
          _placeholder={{ color: "gray.500", fontWeight: "bold" }}
        />
      </InputGroup>
    </Box>
  );
}

// format percentage with 2 decimal places
const formatPercentageBN = (rate: BigNumber) =>
  rate.times(100).toFixed(2) + "%";
