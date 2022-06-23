import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const getBs58PrivateKey = (keypair: Keypair) => {
  return bs58.encode(keypair.secretKey);
};

export const getKeypairFromBs58PrivateKey = (privatekey: string) => {
  return Keypair.fromSecretKey(bs58.decode(privatekey));
};
