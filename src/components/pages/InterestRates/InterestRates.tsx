// Components
import { Column } from "utils/chakraUtils";
import InterestRatesView from "./InterestRatesView";

// Hooks
import { useIsSmallScreen } from "hooks/useIsSmallScreen";

export default function InterestRates() {
  const isMobile = useIsSmallScreen();

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="center"
      color="#FFFFFF"
      mx="auto"
      width={isMobile ? "100%" : "1000px"}
      height="100%"
      px={isMobile ? 4 : 0}
    >
      <InterestRatesView />
    </Column>
  );
}
