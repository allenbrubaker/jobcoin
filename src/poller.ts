import chalk from 'chalk';
import { injectable, inject } from 'inversify';
import { concatMap, count, filter, from, interval, map, mapTo, mergeAll, mergeMap, Observable, of, tap } from 'rxjs';
import { IApiClient } from './api-client';
import { App } from './app';
import { Config } from './config';
import { IMixer } from './mixer';
import { IStorage } from './storage';
import { Symbols } from './types';

export interface IPoller {
  poll(params: PollParams): Observable<number>;
  single(concurrency: number): Observable<number>;
}

export type PollParams = {
  concurrency: number;
  interval: number;
};

@injectable()
export class Poller {
  constructor(
    @inject(Symbols.storage) private _storage: IStorage,
    @inject(Symbols.apiClient) private _api: IApiClient,
    @inject(Symbols.mixer) private _mixer: IMixer
  ) {}
  poll(params: PollParams): Observable<number> {
    console.log(chalk.magenta('Poller started.\n'));
    return interval(params.interval).pipe(mergeMap(() => this.single(params.concurrency)));
  }

  single(concurrency: number): Observable<number> {
    return of(this._storage.keys()).pipe(
      mergeAll(concurrency), // parallelize stream
      mergeMap(depositAddress =>
        this._api.address(depositAddress).pipe(map(add => ({ address: depositAddress, balance: add.balance })))
      ),
      filter(x => +x.balance > 0),
      tap(() => App.isMixing = true),
      mergeMap(x =>
        this._mixer.go({
          pool: Config.poolAddress,
          mix: this._storage.find(x.address),
          amount: x.balance,
          poolDelay: Config.poolDelay,
          staggerPercent: Config.staggerPercent,
          getStaggerDelay: this._mixer.randomDelay(Config.staggerDelayMin, Config.staggerDelayMax)
        })
      ),
      count(),
      tap(() => (App.isMixing = false))
    );
  }
}
