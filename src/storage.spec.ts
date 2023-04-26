import { Startup } from './startup';
import { Mix, Symbols } from './types';
import { IStorage } from './storage';

describe('Storage', () => {
  let _storage: IStorage;

  beforeEach(() => {
    const container = new Startup().register();
    _storage = container.get<IStorage>(Symbols.storage);
  });

  it('should be defined', () => {
    expect(_storage).toBeDefined();
  });

  it('save should store mix instances using the deposit address as the key', async () => {
    const mix: Mix = { deposit: 'deposit', destination: ['a', 'b', 'c'] };
    _storage.save(mix);
    const keys = _storage.keys();
    expect(keys).toHaveLength(1);
    expect(keys[0]).toMatch(mix.deposit);
    expect(_storage.find(mix.deposit)).toMatchObject(mix);
  });

  it('find should return null on missing key', async () => {
    expect(_storage.keys()).toHaveLength(0);
    expect(_storage.find('missing')).toBeNull();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
