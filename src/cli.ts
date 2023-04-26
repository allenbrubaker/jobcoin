import chalk from 'chalk';
import { prompt } from 'inquirer';
import { injectable } from 'inversify';
import { SendCoinRequest } from './types';

export interface ICli {
  hello(): void;
  goodbye(): void;
  addresses(depositAddress: string): Promise<string[]>;
  getDeposit(depositAddress: string): Promise<SendCoinRequest | null>;
  shouldRepeat(): Promise<boolean>;
}

@injectable()
export class Cli {
  hello(): void {
    console.log(chalk.green('Welcome to the Jobcoin mixer!\n\n'));
  }

  goodbye(): void {
    console.log(chalk.green('\n\nThank you for using the Jobcoin mixer! Have a nice day!'));
  }

  async addresses(depositAddress: string): Promise<string[]> {
    const { addresses } = await prompt<{ addresses: string }>([
      {
        name: 'addresses',
        message:
          'Please enter a comma-separated list of new, unused Jobcoin addresses where your mixed Jobcoins will be sent:\n'
      }
    ]);

    console.log('\n' + chalk.magenta(`The deposit address has been generated.\n`))
    return addresses.split(',').map(e => e?.trim()).filter(e => e?.length > 0);
  }

  async getDeposit(depositAddress: string): Promise<SendCoinRequest | null> {
    const { deposit } = await prompt<{ deposit: string }>([
      {
        name: 'deposit',
        message: `Please enter an address and amount to deposit to ${chalk.green(
          depositAddress
        )}. For example: ${chalk.magenta('xyz 100')}. Enter any other string when done:\n`
      }
    ]);
    const results = deposit.trim().match(/^(\w+)\s+(\d*\.?\d*)$/i);
    return !results || Number(results[2]) === 0 ? null : { fromAddress: results[1], amount: results[2], toAddress: depositAddress };
  }

  async shouldRepeat(): Promise<boolean> {
    const { repeat } = await prompt<{ repeat: string }>([
      {
        name: 'repeat',
        message: `Enter ${chalk.green('"y"')} to enter more addresses or any other string to see your deposit addresses: `
      }
    ]);
    return repeat?.toLowerCase() === 'y';
  }
}
