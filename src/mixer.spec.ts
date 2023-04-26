import { Startup } from './startup';
import { StaggerPair, Symbols } from './types';
import { lastValueFrom, of } from 'rxjs';
import { IApiClient } from './api-client';
import { IMixer } from './mixer';

describe('Mixer', () => {
  let _api: IApiClient;
  let _mixer: IMixer;

  beforeEach(() => {
    const container = new Startup().register();
    _api = container.get<IApiClient>(Symbols.apiClient);
    _mixer = container.get<IMixer>(Symbols.mixer);
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  it('should be defined', () => {
    expect(_mixer).toBeDefined();
  });

  describe('go', () => {
    it('should send all coins from the deposit address to the pool and from pool to mixer addresses', async () => {
      const addresses = ['a', 'b', 'c'];
      const deposit = 'deposit';
      const pool = 'pool';
      const amount = '10';
      const staggerAmount = '3';
      const pairs = addresses.map<StaggerPair>(x => ({ address: x, amount: staggerAmount }));
      const stagger = jest.spyOn(_mixer, 'stagger').mockReturnValue(pairs);
      const shuffle = jest.spyOn(_mixer, 'shuffle').mockReturnValue(pairs);
      const sendCoin = jest.spyOn(_api, 'sendCoin').mockReturnValue(of({} as any));

      const params = {
        amount,
        mix: { deposit, destination: addresses },
        pool,
        staggerPercent: 0,
        poolDelay: 0,
        getStaggerDelay: () => 0
      };
      await lastValueFrom(_mixer.go(params));

      expect(sendCoin).toHaveBeenCalledTimes(4);
      expect(sendCoin).toHaveBeenNthCalledWith(1, { amount, fromAddress: deposit, toAddress: pool });
      expect(sendCoin).toHaveBeenNthCalledWith(2, {
        amount: staggerAmount,
        fromAddress: pool,
        toAddress: addresses[0]
      });
      expect(sendCoin).toHaveBeenNthCalledWith(3, {
        amount: staggerAmount,
        fromAddress: pool,
        toAddress: addresses[1]
      });
      expect(sendCoin).toHaveBeenNthCalledWith(4, {
        amount: staggerAmount,
        fromAddress: pool,
        toAddress: addresses[2]
      });
    });
  });

  describe('stagger', () => {
    it('should distribute coins across all addresses with sufficient stagger percent', () => {
      const addresses = ['a', 'b', 'c', 'd', 'e'];
      const amount = '100';
      const staggerPercent = 0.1;
      const pairs = _mixer.stagger(amount, addresses, staggerPercent);
      const unique = [...new Set(pairs.map(x => x.address)).keys()];
      expect(unique).toEqual(addresses);
    });

    it('should distribute coins across all addresses with insufficient stagger percent', () => {
      const addresses = ['a', 'b', 'c', 'd', 'e'];
      const amount = '100';

      let staggerPercent = 0.5;
      let pairs = _mixer.stagger(amount, addresses, staggerPercent);
      let unique = [...new Set(pairs.map(x => x.address)).keys()];
      expect(unique).toEqual(addresses);

      staggerPercent = 0;
      pairs = _mixer.stagger(amount, addresses, staggerPercent);
      unique = [...new Set(pairs.map(x => x.address)).keys()];
      expect(unique).toEqual(addresses);
    });

    it('should distribute exactly the amount of coins provided', () => {
      const amount = '100.123456789';
      const addresses = ['a', 'b', 'c', 'd', 'e', 'f'];

      let staggerPercent = 0.15;
      let pairs = _mixer.stagger(amount, addresses, staggerPercent);
      let amounts = pairs.map(e => e.amount);
      expect(amounts).toEqual(['15', '15', '15', '15', '15', '15', '10', '.123456789']);

      staggerPercent = 0.5;
      pairs = _mixer.stagger(amount, addresses, staggerPercent);
      amounts = pairs.map(e => e.amount);
      expect(amounts).toEqual(['16', '16', '16', '16', '16', '16', '4', '.123456789']);
    });

    it('should precisely distribute fractional amounts', () => {
      const amount = '0.123456789';
      const addresses = ['a', 'b', 'c'];
      let staggerPercent = 0.1;
      let pairs = _mixer.stagger(amount, addresses, staggerPercent);
      let amounts = pairs.map(e => e.amount);
      expect(amounts).toEqual(['.123456789']);
    });

    it('should distribute only positive amounts', () => {
      const amount = '50';
      const addresses = ['a', 'b', 'c'];
      let staggerPercent = 0.1;
      let pairs = _mixer.stagger(amount, addresses, staggerPercent);
      expect(pairs.every(e => Number(e.amount) > 0)).toBeTruthy();
    });
    
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
