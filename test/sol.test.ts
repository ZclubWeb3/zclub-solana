import * as Web3 from '@solana/web3.js';

import { SOL } from '../src';

describe('SOL TEST', () => {
  let connection: Web3.Connection;
  let keypair1 = Web3.Keypair.generate();
  let keypair2 = Web3.Keypair.generate();

  beforeAll(async () => {
    connection = new Web3.Connection('http://localhost:8899', 'confirmed');
    const signature = await connection.requestAirdrop(
      keypair1.publicKey,
      Web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(signature);
  });

  test('query amount', async () => {
    const balance = await SOL.getBalance(connection, keypair1.publicKey);
    expect(balance).toEqual(Web3.LAMPORTS_PER_SOL);
  });

  test('transfer', async () => {
    try {
      const encodedTx = await SOL.transfer(
        connection,
        keypair1,
        keypair1,
        keypair2.publicKey,
        BigInt(Web3.LAMPORTS_PER_SOL / 2),
      );
      const signature = await connection.sendEncodedTransaction(encodedTx);
      await connection.confirmTransaction(signature);
    } catch (e) {
      console.log('transfer fail', e);
    }
    const balance = await SOL.getBalance(connection, keypair2.publicKey);
    expect(balance.toString()).toEqual(String(Web3.LAMPORTS_PER_SOL / 2));
  });
});
