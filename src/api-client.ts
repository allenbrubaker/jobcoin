import { retryBackoff } from '@nick-bull/rxjs-backoff';
import axios, { AxiosError } from 'axios';
import { injectable } from 'inversify';
import { catchError, from, map, mapTo, Observable, pipe, tap, throwError } from 'rxjs';
import { Config } from './config';
import { Address, Transaction, InsufficientFundsError, SendCoinRequest } from './types';

const API_ADDRESS_URL = `${Config.api}/addresses`;
const API_TRANSACTIONS_URL = `${Config.api}/transactions`;

export interface IApiClient {
  address(address: string): Observable<Address>;
  transactions(): Observable<Transaction[]>;
  sendCoin(body: SendCoinRequest): Observable<SendCoinRequest>;
}

@injectable()
export class ApiClient implements IApiClient {
  address(address: string): Observable<Address> {
    return this.get<Address>(`${API_ADDRESS_URL}/${address}`);
  }

  transactions(): Observable<Transaction[]> {
    return this.get<Transaction[]>(API_TRANSACTIONS_URL);
  }

  sendCoin(body: SendCoinRequest): Observable<SendCoinRequest> {
    return this.post(API_TRANSACTIONS_URL, body).pipe(
      mapTo(body),
      tap({ complete: () => console.log('Sent JobCoin', body) })
    );
  }

  private get<T>(url: string): Observable<T> {
    return from(axios.get<T>(url)).pipe(
      this.retryPolicy,
      map(e => e.data)
    );
  }

  private post(url: string, body: any): Observable<void> {
    return from(axios.post(url, body)).pipe(
      this.retryPolicy,
      map(e => e.data)
    );
  }

  private retryPolicy = pipe(
    retryBackoff({
      shouldRetry: e => !this.isInsufficientFundsError(e), // short circuit on insufficient funds
      maxRetries: Config.retries,
      initialInterval: 1000
    }),
    catchError(error => {
      if (this.isInsufficientFundsError(error)) error = new InsufficientFundsError();
      return throwError(() => error);
    })
  );

  private isInsufficientFundsError(error: any) {
    return (error as AxiosError)?.response?.status !== InsufficientFundsError.statusCode;
  }
}
