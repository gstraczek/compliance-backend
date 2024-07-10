const FILECOIN_GENESIS_UNIX_EPOCH = 1598306400;

export const heightToUnix = (filEpoch: number) => {
  return filEpoch * 30 + FILECOIN_GENESIS_UNIX_EPOCH;
};

export const getCurrentEpoch = () => {
  return Math.floor((Date.now() / 1000 - FILECOIN_GENESIS_UNIX_EPOCH) / 30);
};
