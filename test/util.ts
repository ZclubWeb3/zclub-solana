import * as Web3 from '@solana/web3.js';

export const sleep = async (time = 2000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(0);
    }, time);
  });
};
export const requestAirdrop = async (
  connection: Web3.Connection,
  address: Web3.PublicKey,
  times = 1,
) => {
  while (times) {
    const signature = await connection.requestAirdrop(
      address,
      Web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(signature);
    if (times--) {
      await sleep();
    }
  }
};
