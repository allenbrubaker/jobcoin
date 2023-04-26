import { injectable } from 'inversify';
import { Mix } from './types';

export interface IStorage {
  save(mix: Mix): void;
  find(address: string): Mix | null;
  values(): Mix[];
  keys(): string[];
}

@injectable()
export class Storage {
  private readonly _store: Record<string, Mix> = {};
  save(mix: Mix): Mix {
    this._store[mix.deposit] = mix;
    return mix;
  }
  find(address: string): Mix | null {
    return this._store[address] ?? null;
  }
  keys(): string[] {
    return Object.keys(this._store);
  }
  values(): Mix[] {
    return Object.values(this._store);
  }
}
