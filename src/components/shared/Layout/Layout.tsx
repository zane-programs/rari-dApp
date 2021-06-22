//@ts-nocheck

import { Column } from "utils/chakraUtils";
import NewHeader from "../Header2/NewHeader2";
import Footer from "./Footer";

// add focus-visible to only show
// :focus styles for keyboard events
import "focus-visible";

const Layout = ({ children }) => {
  return (
    <Column height="100%" flex={1}>
      <NewHeader />
      {children}
      <Footer />
    </Column>
  );
};

export default Layout;
