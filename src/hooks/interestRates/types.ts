import BigNumber from "bignumber.js";

export type InterestRatesType = {
  lending: BigNumber;
  borrowing: BigNumber;
};

export type MarketInfo = {
  tokenAddress: string;
  rates: InterestRatesType;
};
