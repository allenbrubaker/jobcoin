import { Startup } from './startup';
import { Mix, Symbols } from './types';
import { of } from 'rxjs';
import { IApiClient } from './api-client';
import { IPoller } from './poller';
import { IUtils } from './utils';
import { IStorage } from './storage';
import { IApp } from './app';
import { ICli } from './cli';

describe('App', () => {
  let _app: IApp;
  let _poller: IPoller;
  let _utils: IUtils;
  let _api: IApiClient;
  let _storage: IStorage;
  let _cli: ICli;

  beforeEach(() => {
    const container = new Startup().register();
    _poller = container.get<IPoller>(Symbols.poller);
    _utils = container.get<IUtils>(Symbols.utils);
    _api = container.get<IApiClient>(Symbols.apiClient);
    _storage = container.get<IStorage>(Symbols.storage);
    _cli = container.get<ICli>(Symbols.cli);
    _app = container.get<IApp>(Symbols.app);
    
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(_cli, 'hello').mockImplementation();
    jest.spyOn(_cli, 'goodbye').mockImplementation();
    jest.spyOn(_cli, 'shouldRepeat').mockImplementation();
    jest.spyOn(_cli, 'getDeposit').mockImplementation();
    jest.spyOn(_utils, 'delay').mockResolvedValue();
    jest.spyOn(_utils, 'waitUntil').mockResolvedValue();
    jest.spyOn(_poller, 'poll').mockReturnValue(of());
  });

  it('should be defined', () => {
    expect(_app).toBeDefined();
  });

  describe('run', () => {
    it('should repeatedly call runOnce until it returns false', async () => {
      const runOnce = jest.spyOn(_app, 'runOnce').mockResolvedValue(false).mockResolvedValueOnce(true); 
      await _app.run();
      expect(runOnce).toHaveBeenCalledTimes(2);
    });
  });

  describe('runOnce', () => {
    it('should generate a deposit address, pair with user supplied destination addresses, and save pair to database', async () => {
      const addresses = ['a', 'b', 'c'];
      const deposit = 'deposit';
      jest.spyOn(_cli, 'addresses').mockResolvedValue(addresses);
      jest.spyOn(_utils, 'generateAddress').mockReturnValue(deposit);
      const save = jest.spyOn(_storage, 'save').mockImplementation();
      await _app.runOnce();
      expect(save).toHaveBeenCalledTimes(1);
      const mix: Mix = { deposit, destination: addresses };
      expect(save).toHaveBeenCalledWith(mix);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
