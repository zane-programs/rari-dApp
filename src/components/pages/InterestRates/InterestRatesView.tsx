import { useEffect, useMemo, useState, createContext } from "react";

// Components
import {
  Box,
  Center,
  Flex,
  Heading,
  Spacer,
  Spinner,
  Table,
  Tbody,
  Thead,
  Td,
  Th,
  Tr,
} from "@chakra-ui/react";
import { Column } from "utils/chakraUtils";
import InterestRatesRow from "./InterestRatesRow";
import MultiPicker from "./MultiPicker";
import TokenSearch from "./TokenSearch";

// Hooks
import { TokenData, fetchTokenData } from "hooks/useTokenData";
// Aave
import useReserves from "hooks/interestRates/aave/useReserves";
// Compound
import useCompoundMarkets from "hooks/interestRates/compound/useCompoundMarkets";

// Types
import { MarketInfo } from "hooks/interestRates/types";

export enum InterestRatesTableOptions {
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
export const InterestRatesContext = createContext<InterestRatesContext>({
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

      // sort token data according to market cap
      tokenDataList.sort(
        (a, b) =>
          tokenAddresses.indexOf(a.address) - tokenAddresses.indexOf(b.address)
      );

      // set list in state
      setTokenData(tokenDataList);
    }

    getTokenData();
  }, [aaveReserves, compoundMarkets, setTokenData]);

  // token list filtered by search term
  const filteredTokenData = useMemo(
    () =>
      tokenSearchValue === ""
        ? tokenData
        : tokenData // filter token by search term
            .filter(
              (token) =>
                token.name
                  .toLowerCase()
                  .includes(tokenSearchValue.toLowerCase()) ||
                token.symbol
                  .toLowerCase()
                  .includes(tokenSearchValue.toLowerCase())
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
        {tokenData.length === 0 ? (
          <Center w="100%" h="100px">
            <Spinner size="xl" />
          </Center>
        ) : (
          <>
            <Flex w="100%">
              <Box flex="3">
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
              <Box flex="3">
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
                {filteredTokenData.length === 0 && tokenSearchValue !== "" ? (
                  <Tr>
                    {/* large colSpan because "100%" was not recognized as valid by TypeScript */}
                    <Td colSpan={1000}>
                      No items found that match your search: &ldquo;
                      {tokenSearchValue}&rdquo;
                    </Td>
                  </Tr>
                ) : (
                  filteredTokenData.map(({ address }) => (
                    <InterestRatesRow assetAddress={address} key={address} />
                  ))
                )}
              </Tbody>
            </Table>
          </>
        )}
      </Column>
    </InterestRatesContext.Provider>
  );
}
