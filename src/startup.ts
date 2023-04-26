import "reflect-metadata"; // prerequisite for inversify

import axios from 'axios';
import axiosRetry from 'axios-retry';
import { BindingScopeEnum, Container } from 'inversify';
import { ApiClient, IApiClient } from './api-client';
import { App, IApp } from './app';
import { Cli, ICli } from './cli';
import { IMixer, Mixer } from './mixer';
import { IPoller, Poller } from './poller';
import { IStorage, Storage } from './storage';
import { InsufficientFundsError } from './types';
import { Symbols } from './types';
import { IUtils, Utils } from './utils';

const RETRIES = 3;

export class Startup {
  register(): Container {
    const container = new Container({ defaultScope: BindingScopeEnum.Singleton });
    container.bind<IApiClient>(Symbols.apiClient).to(ApiClient);
    container.bind<IUtils>(Symbols.utils).to(Utils);
    container.bind<ICli>(Symbols.cli).to(Cli);
    container.bind<IStorage>(Symbols.storage).to(Storage);
    container.bind<IApp>(Symbols.app).to(App);
    container.bind<IMixer>(Symbols.mixer).to(Mixer);
    container.bind<IPoller>(Symbols.poller).to(Poller);

    // axiosRetry(axios, {
    //   retries: RETRIES,
    //   retryDelay: retryCount => {
    //     console.log(`retry attempt: ${retryCount}`);
    //     return 1000 * Math.pow(2, retryCount - 1);
    //   },
    //   retryCondition: error => error.response.status !== InsufficientFundsError.statusCode
    // });

    return container;
  }

  async start(container: Container): Promise<void> {
    const app = container.get<IApp>(Symbols.app);
    await app.run();
  }
}
