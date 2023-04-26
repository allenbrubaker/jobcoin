import { Startup } from './startup';
import { Symbols } from './types';
import { IUtils } from './utils';

describe('Utils', () => {
  let _utils: IUtils;
  beforeEach(() => {
    const container = new Startup().register();
    _utils = container.get<IUtils>(Symbols.utils);
  });

  it('should be defined', () => {
    expect(_utils).toBeDefined();
  });

  it('generateAddress generates a hexadecimal string with 8 characters', () => {
    const address = _utils.generateAddress();
    expect(typeof address).toEqual('string');
    expect(address).toHaveLength(8);
    expect(address).toMatch(/^[0-9a-fA-F]+$/);
  });
});
