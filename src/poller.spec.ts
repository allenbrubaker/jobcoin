import { Startup } from './startup';
import { Symbols } from './types';
import { IPoller } from './poller';
import { lastValueFrom, of } from 'rxjs';
import { IUtils } from './utils';
import { IApiClient } from './api-client';
import { IStorage } from './storage';
import { IMixer } from './mixer';

describe('Poller', () => {
  let _poller: IPoller;
  let _utils: IUtils;
  let _api: IApiClient;
  let _storage: IStorage;
  let _mixer: IMixer;

  beforeEach(() => {
    const container = new Startup().register();
    _poller = container.get<IPoller>(Symbols.poller);
    _utils = container.get<IUtils>(Symbols.utils);
    _api = container.get<IApiClient>(Symbols.apiClient);
    _storage = container.get<IStorage>(Symbols.storage);
    _mixer = container.get<IMixer>(Symbols.mixer);
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  })

  it('should be defined', () => {
    expect(_poller).toBeDefined();
  });

  it('poll should repeatedly call single at a constant interval', async () => {
    const single = jest.spyOn(_poller, 'single').mockReturnValue(of(1));
    const interval = 50;
    
    const poll = _poller.poll({ concurrency: 3, interval }).subscribe();
    await _utils.delay(interval * 2.2);
    poll.unsubscribe();

    expect(single).toHaveBeenCalledTimes(2);
    expect(single).toHaveBeenCalledWith(3);
  });

  it('single should mix all deposit addresses with a positive balance', async () => {
    const keys = ['a', 'b', 'c']
    const storage = jest.spyOn(_storage, 'keys').mockReturnValue(keys);
    const api = jest.spyOn(_api, 'address').mockReturnValue(of({ transactions: [], balance: '10' }));
    const mix = jest.spyOn(_mixer, 'go').mockReturnValue(of(111));

    const count = await lastValueFrom(_poller.single(2));

    expect(mix).toHaveBeenCalledTimes(keys.length);
    expect(count).toEqual(keys.length);
  });

  it('single should not mix addresses with a 0 balance', async () => {
    const keys = ['a', 'b', 'c'];
    const storage = jest.spyOn(_storage, 'keys').mockReturnValue(keys);
    const api = jest.spyOn(_api, 'address').mockReturnValue(of({ transactions: [], balance: '0' }));
    const mix = jest.spyOn(_mixer, 'go').mockReturnValue(of(111));

    const count = await lastValueFrom(_poller.single(2));

    expect(mix).toHaveBeenCalledTimes(0);
    expect(count).toEqual(0);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
