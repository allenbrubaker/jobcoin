import { injectable } from 'inversify';
import { defaultIfEmpty, interval, lastValueFrom, mapTo, mergeMap, of, takeUntil, takeWhile } from 'rxjs';

const crypto = require('crypto');

export interface IUtils {
  generateAddress(): string;
  delay(time: number): Promise<void>;
  waitUntil(predicate: () => boolean): Promise<void>;
}

@injectable()
export class Utils implements IUtils {
  generateAddress(): string {
    const hash = crypto.createHash('sha256');
    return hash.update(`${Date.now()}`).digest('hex').substring(0, 8);
  }

  delay(time: number): Promise<void> {
    return new Promise<void>(res => setTimeout(res, time));
  }

  async waitUntil(predicate: () => boolean, poll = 500): Promise<void> {
    await lastValueFrom(
      interval(poll).pipe(
        takeWhile(() => !predicate()),
        defaultIfEmpty(true)
      )
    );
  }
}
