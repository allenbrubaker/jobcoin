
# Welcome to JobCoin Mixer!

Implementation of a coin mixer to anonymize transactions.

## Flow for coin mixers
1. You provide a list of new, unused addresses that you own to the mixer.
2. The mixer provides you with a new deposit address that it owns.
3. You transfer your bitcoins to that address.
4. The mixer will detect your transfer by watching or polling the P2P Bitcoin network.
5. The mixer will transfer your bitcoin from the deposit address into a big _house_ account along with all the other bitcoin currently being mixed.
6. Then, over some time the mixer will use the house account to dole out your bitcoin in smaller randomized discrete amounts to the withdrawal addresses that you provided, possibly after deducting a fee.

## Solution

This mixer collects all groups of deposit addresses on application start,
because it is not possible to simultanously read user input and output application logs.

This will allow one to test mixing multiple groups of addresses simultaneously, 
which is fully supported. In other words, mixes to different groups of addresses will
be interleaved, while those in the same mix group will be contiguously staggered
one after the next for a random time span in the range [`staggerDelayMin`, `staggerDelayMax`]. 

For tracing purposes, all transactions are logged. This way you can observe interleaving happening live between different mix groups.


## Configuration

Many aspects of this application are exposed as configuration variables 
that can be modified in `config.ts`. Feel free to adjust as needed.

- `retries`: Calls to the api gateway are resilient with an exponential backoff policy and short-circuiting for insufficient funds (422) error. Configuring this variable will configure the amount of retry attempts before finally throwing an error.
- `api`: base url to the JobCoin api.
- `poolAddress`: Pool or house address that all mixes are sent through.
- `poolDelay`: Number of milliseconds the coins should sit in the pool until sent to the destination addresses.
- `pollingInterval`: The interval in milliseconds that the poller will check the deposit addresses for a positive balance.
- `concurrency`: Maximum number of mixer groups to process at any given moment.
- `staggerPercent`: Max coins moved in a single transaction compared to the total amount.
- `staggerDelayMin`: See above.
- `staggerDelayMax`: See above.


## Commands

- Run `npm install` to install dependencies.
- Run `npm run test` to run unit tests.
- Run `npm run start` to run the app.


