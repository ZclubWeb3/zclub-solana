import * as Web3 from '@solana/web3.js';

import { Account } from '../src';

describe('Account Secrets Transform', () => {
  let keypair1 = Web3.Keypair.generate();

  test('Tranfrom between Keypair and Privitekey', () => {
    const privatekey = Account.getBs58PrivateKey(keypair1);
    console.log('public key before', keypair1.publicKey.toBase58());
    console.log('secret key before', keypair1.secretKey.toString());
    console.log('privatekey before', privatekey);
    const keypair = Account.getKeypairFromBs58PrivateKey(privatekey);
    console.log('public key after', keypair.publicKey.toString());
    console.log('secret key after', keypair.secretKey.toString());
    expect(keypair.publicKey.toString()).toEqual(keypair1.publicKey.toString());
    expect(keypair.secretKey.toString()).toEqual(keypair1.secretKey.toString());
  });
});
