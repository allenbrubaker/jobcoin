const Config = {
  retries: 4,
  api: 'https://jobcoin.gemini.com/plus-overshoot/api',
  poolAddress: '228b921e',
  poolDelay: 5000,
  pollingInterval: 5000,
  concurrency: 3,
  staggerDelayMin: 1000,
  staggerDelayMax: 3000,
  staggerPercent: .1, 
};

export { Config };
