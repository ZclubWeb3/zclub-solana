import * as Web3 from '@solana/web3.js';
import bs58 from 'bs58';

import KeypairID_TANG from '../.tmp/data/keypaires/TANGL.json';
import KeypairID_ZCLUB from '../.tmp/data/keypaires/ZCLUB.json';
import { Account } from '../src';

describe('Account TEST', () => {
  let connection: Web3.Connection;
  let keypair1 = Web3.Keypair.fromSecretKey(Uint8Array.from(KeypairID_TANG));
  let keypair2 = Web3.Keypair.fromSecretKey(Uint8Array.from(KeypairID_ZCLUB));

  test('', () => {
    console.log(keypair1.publicKey.toBase58());
    console.log(Account.getBs58PrivateKey(keypair1));

    console.log(keypair2.publicKey.toBase58());
    // console.log();
    const privatekey = Account.getBs58PrivateKey(keypair2);

    const keypair = Web3.Keypair.fromSecretKey(bs58.decode(privatekey));
    console.log('publickey', keypair.publicKey.toString());
    console.log('secretKey', keypair.secretKey.toString());
    expect(keypair.publicKey.toString()).toEqual(keypair2.publicKey.toString());
    expect(keypair.secretKey.toString()).toEqual(keypair2.secretKey.toString());
  });
});
