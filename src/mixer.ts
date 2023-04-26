import { inject, injectable } from 'inversify';
import { defer, delay, mapTo, mergeMap, Observable, reduce, tap, catchError, concatMap, of, from } from 'rxjs';
import { IApiClient } from './api-client';
import { Mix, Symbols, StaggerPair } from './types';

export interface IMixer {
  go(params: MixerParams): Observable<number>;
  randomDelay: (min: number, max: number) => () => number;
  stagger(amount: string, addresses: string[], staggerPercent: number): StaggerPair[];
  shuffle<T>(array: T[]): T[];
}

export type MixerParams = {
  staggerPercent: number;
  pool: string;
  poolDelay: number;
  mix: Mix;
  amount: string;
  getStaggerDelay: () => number;
};

@injectable()
export class Mixer {
  constructor(@inject(Symbols.apiClient) private _api: IApiClient) {}

  go({ pool, mix, amount, staggerPercent, getStaggerDelay, poolDelay }: MixerParams): Observable<number> {
    const start = Date.now();
    return this._api.sendCoin({ amount, fromAddress: mix.deposit, toAddress: pool }).pipe(
      delay(poolDelay),
      mergeMap(() => this.shuffle(this.stagger(amount, mix.destination, staggerPercent))),
      concatMap(pair =>
        of(pair).pipe(delay(getStaggerDelay()))
      ),
      mergeMap(pair => this._api.sendCoin({ fromAddress: pool, toAddress: pair.address, amount: pair.amount })),
      reduce(acc => acc + 1, 0),
      tap(x => {
        console.log(`Completed mixing`, {
          transfers: x,
          deposit: mix.deposit,
          mix: mix.destination,
          amount: `${amount} JobCoins`,
          duration: `${(Date.now() - start) / 1000} seconds`
        });
      })
    );
  }

  randomDelay = (min: number, max: number) => () => Math.random() * (max - min) + min;

  // calculate stagger amount, round robin, then shuffle
  stagger(amount: string, addresses: string[], staggerPercent: number): StaggerPair[] {
    const match = amount.match(/(\d*)\.?(\d*)/); // preserve amount to be as accurate as possible
    const [whole, fraction] = [Number(match[1] ?? '0'), '.' + (match[2] || '0')];
    let stagger = Math.trunc(staggerPercent * whole);
    if (stagger * addresses.length > whole || stagger === 0)
      // not enough to stagger across all addresses
      stagger = Math.max(1, Math.trunc(whole / addresses.length)); // Stagger at least 1 whole coin per address. We risk precision loss when splitting decimals.
    const pairs = [] as StaggerPair[];

    // round robin
    let left = whole,
      i = 0;
    for (; left - stagger >= 0; i = (i + 1) % addresses.length) {
      pairs.push({ address: addresses[i], amount: stagger.toString() });
      left -= stagger;
    }
    if (left > 0) {
      pairs.push({ address: addresses[i], amount: left.toString() });
      i = (i + 1) % addresses.length;
    }
    if (Number(fraction) > 0) pairs.push({ address: addresses[i], amount: fraction });
    return pairs;
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; --i) {
      const j = Math.trunc(Math.random() * i);
      const t = array[i];
      array[i] = array[j];
      array[j] = t;
    }
    return array;
  }
}
