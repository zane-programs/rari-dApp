import {
  useContext,
  useEffect,
  useMemo,
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
import { TokenData, fetchTokenData } from "hooks/useTokenData";
// Aave
import useReserves from "hooks/interestRates/aave/useReserves";
// Compound
import useCompoundMarkets from "hooks/interestRates/compound/useCompoundMarkets";
// import useCToken from "hooks/interestRates/compound/useCToken";

// Utils
import BigNumber from "bignumber.js";

// Types
import { MarketInfo } from "hooks/interestRates/types";

enum InterestRatesTableOptions {
  Lending = "lending",
  Borrowing = "borrowing",
}

type InterestRatesContext = {
  selectedTable: InterestRatesTableOptions;
  tokens: TokenData[];
  markets: {
    aave: MarketInfo[];
    compound: MarketInfo[];
  };
  marketDataLoaded: boolean; // whether or not the market data has loaded
};
const InterestRatesContext = createContext<InterestRatesContext>({
  selectedTable: InterestRatesTableOptions.Lending,
  tokens: [],
  markets: {
    aave: [],
    compound: [],
  },
  marketDataLoaded: false,
});

export default function InterestRatesView() {
  // name of table in view (current)
  const [tableName, setTableName] = useState<InterestRatesTableOptions>(
    InterestRatesTableOptions.Lending
  );
  // search term in TokenSearch component
  const [tokenSearchValue, setTokenSearchValue] = useState("");
  // information about each token
  const [tokenData, setTokenData] = useState<TokenData[]>([]);

  // Aave
  const aaveReserves = useReserves();
  // Compound
  const compoundMarkets = useCompoundMarkets();

  useEffect(() => {
    async function getTokenData() {
      // gather list of all tokens, using Set to get a unique list
      // (added downlevelIteration as true to tsconfig.json to support
      // spread operator for Set)
      const tokenAddresses = [
        ...new Set([
          ...aaveReserves.map((reserve) => reserve.tokenAddress),
          ...compoundMarkets.map((market) => market.tokenAddress),
        ]),
      ];

      // fetch token data asynchronously
      const tokenDataList: TokenData[] = [];
      await Promise.all(
        tokenAddresses.map(async (address) => {
          tokenDataList.push(await fetchTokenData(address));
        })
      );

      // sort token data according to order in tokenAddresses
      tokenDataList.sort(
        (a, b) =>
          tokenAddresses.indexOf(a.address) - tokenAddresses.indexOf(b.address)
      );

      // set list in state
      setTokenData(tokenDataList);
    }

    getTokenData();
  }, [aaveReserves]);

  // token list filtered by search term
  const filteredTokenData = useMemo(
    () =>
      tokenSearchValue === ""
        ? tokenData
        : tokenData.filter(
            (token) =>
              token.name
                .toLowerCase()
                .startsWith(tokenSearchValue.toLowerCase()) ||
              token.symbol
                .toLowerCase()
                .startsWith(tokenSearchValue.toLowerCase())
          ),
    [tokenSearchValue, tokenData]
  );

  return (
    <InterestRatesContext.Provider
      value={{
        selectedTable: tableName,
        tokens: filteredTokenData,
        markets: { aave: aaveReserves, compound: compoundMarkets },
        marketDataLoaded: aaveReserves.length > 0 && compoundMarkets.length > 0,
      }}
    >
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
        {aaveReserves.length === 0 ? (
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
                <TokenSearch onChange={setTokenSearchValue} />
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
                {filteredTokenData.map(({ address }) => (
                  <InterestRatesRow assetAddress={address} key={address} />
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
    <Tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
  // undefined = loading, null = not present
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

function TokenSearch({ onChange }: { onChange: (value: string) => void }) {
  const [val, setVal] = useState("");

  // run onChange on value change
  useEffect(() => {
    onChange(val);
  }, [val, onChange]);

  return (
    <Box>
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
