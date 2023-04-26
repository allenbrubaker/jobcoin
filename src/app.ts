import { inject, injectable } from 'inversify';
import { IApiClient } from './api-client';
import { ICli } from './cli';
import { IStorage } from './storage';
import { Symbols, Mix, InsufficientFundsError } from './types';
import { IUtils } from './utils';
import chalk from 'chalk';
import { IPoller } from './poller';
import { Config } from './config';

export interface IApp {
  run(): Promise<void>;
  runOnce(): Promise<boolean>;
}

@injectable()
export class App {
  static isMixing = false;
  constructor(
    @inject(Symbols.cli) private _cli: ICli,
    @inject(Symbols.utils) private _utils: IUtils,
    @inject(Symbols.storage) private _storage: IStorage,
    @inject(Symbols.apiClient) private _api: IApiClient,
    @inject(Symbols.poller) private _poller: IPoller
  ) {}

  async run(): Promise<void> {
    this._cli.hello();
    const poll$ = this._poller.poll({ concurrency: Config.concurrency, interval: Config.pollingInterval }).subscribe();

    // Collect all groups of deposit addresses at the start because it is not possible to simultanously read user input and output application logs.
    // This will also allow one to test mixing multiple groups of addresses simultaneously, which is fully supported.
    for (let repeat = true; repeat; ) {
      repeat = await this.runOnce();
    }
    console.log('Your addresses are', this._storage.values())
    console.log('\nYou may send JobCoins to any of these deposit addresses simultaneously.');
    console.log(chalk.magenta('\nWaiting for coins to be deposited.'));
    await this._utils.waitUntil(() => App.isMixing);
    console.log(chalk.magenta('\nMixing in progress...'));
    await this._utils.waitUntil(() => false);
    poll$.unsubscribe();
    this._cli.goodbye();
    await this._utils.delay(1000);
  }

  async runOnce(): Promise<boolean> {
    const mix = await this.generateMix();
    this._storage.save(mix); // Save mix for poller to query.
    const repeat =  await this._cli.shouldRepeat();
    return repeat;
  }

  private async generateMix(): Promise<Mix> {
    const depositAddress = this._utils.generateAddress();
    const addresses = await this._cli.addresses(depositAddress);
    return { deposit: depositAddress, destination: addresses };
  }

  private async userDeposit(address: string) {
    const deposit = await this._cli.getDeposit(address);
    if (!deposit) return;
    this._api.sendCoin(deposit).subscribe({
      error: e => {
        if (e instanceof InsufficientFundsError) {
          console.error(`Insufficient funds. Please add more funds to your account ${deposit.fromAddress}.`);
        } else {
          console.error(`Error sending coin: ${(e as Error).message}. \nPlease try again.`);
        }
      }
    });
    await this.userDeposit(address);
  }
}
