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
  Heading,
  Button,
  ButtonGroup,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Column } from "utils/chakraUtils";

type Asset = {
  name: string;
  symbol: string;
};

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

  // const { address, rari } = useRari();

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
        <MultiPicker
          options={{
            lending: "Lending Rates",
            borrowing: "Borrowing Rates",
          }}
          // set table on change
          onChange={(value) => setTableName(value as InterestRatesTableOptions)}
        />
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
            <InterestRatesRow asset={{ name: "Bancor", symbol: "BNT" }} />
            <InterestRatesRow asset={{ name: "Dai", symbol: "DAI" }} />
            <InterestRatesRow asset={{ name: "ZeroEx", symbol: "ZRX" }} />
          </Tbody>
        </Table>
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

function InterestRatesRow({ asset }: { asset: Asset }) {
  return (
    <MotionTr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Td fontWeight="bold">
        {asset.name} ({asset.symbol})
      </Td>
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={0.0342} borrowingRate={0.0666} />
      </Td>
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={0.0342} borrowingRate={0.0666} />
      </Td>
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={0.0342} borrowingRate={0.0666} />
      </Td>
      <Td textAlign="center">
        <AnimatedPercentage lendingRate={0.0342} borrowingRate={0.0666} />
      </Td>
    </MotionTr>
  );
}

function AnimatedPercentage({
  lendingRate,
  borrowingRate,
}: {
  lendingRate: number;
  borrowingRate: number;
}) {
  const selectedTable = useContext(InterestRatesContext);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ ease: "easeOut", duration: 0.25 }}
      style={{ position: "relative" }}
      // had to add key prop for framer-motion to animate
      key={selectedTable}
    >
      {formatPercentage(
        selectedTable === InterestRatesTableOptions.Lending
          ? lendingRate
          : borrowingRate
      )}
    </motion.div>
  );
}

// format percentage using user locale
const formatPercentage = (rate: number) =>
  (rate * 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }) + "%";

const MotionTr = motion(Tr);
