export type Transaction = {
  timestamp: string;
  fromAddress?: string;
  toAddress: string;
  amount: string;
};

export type Address = {
  balance: string;
  transactions: Transaction[];
};

export type SendCoinRequest = {
    fromAddress: string;
    toAddress: string;
    amount: string;
}

export class InsufficientFundsError extends Error {
  static statusCode = 422;
}

export type Mix = {
  deposit: string;
  destination: string[];
};

export type StaggerPair = {
    address: string;
    amount: string;
}

const Symbols = {
  apiClient: Symbol.for('ApiClient'),
  utils: Symbol.for('Utils'),
  cli: Symbol.for('Cli'),
  app: Symbol.for('App'),
  mixer: Symbol.for('Mixer'),
  storage: Symbol.for('Storage'),
  poller: Symbol.for('Poller')
};

export { Symbols };
