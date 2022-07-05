import * as Web3 from '@solana/web3.js';

import { requestAirdrop } from './util';
import { SOL } from '../src';

describe('SOL TEST', () => {
  let connection: Web3.Connection;
  let keypair1 = Web3.Keypair.generate();
  let keypair2 = Web3.Keypair.generate();

  beforeAll(async () => {
    connection = new Web3.Connection('http://localhost:8899', 'confirmed');
    await requestAirdrop(connection, keypair1.publicKey, 2);
  });

  test('query amount', async () => {
    const balance = await SOL.getBalance(connection, keypair1.publicKey);
    expect(balance).toEqual(BigInt(Web3.LAMPORTS_PER_SOL * 2));
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
      const signature = await connection.sendEncodedTransaction(
        encodedTx.encodedSignature,
      );
      await connection.confirmTransaction(signature);
    } catch (e) {
      console.log('transfer fail', e);
    }
    const balance = await SOL.getBalance(connection, keypair2.publicKey);
    expect(balance.toString()).toEqual(String(Web3.LAMPORTS_PER_SOL / 2));
  });

  test('batch transfer', async () => {
    let keypair3 = Web3.Keypair.generate();
    let keypair4 = Web3.Keypair.generate();
    const encodedTx = await SOL.batchTransfer(connection, [
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair3.publicKey,
        amount: BigInt(Web3.LAMPORTS_PER_SOL / 2),
      },
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair4.publicKey,
        amount: BigInt(Web3.LAMPORTS_PER_SOL / 2),
      },
    ]);
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    expect(await SOL.getBalance(connection, keypair3.publicKey)).toEqual(
      BigInt(Web3.LAMPORTS_PER_SOL / 2),
    );
    expect(await SOL.getBalance(connection, keypair4.publicKey)).toEqual(
      BigInt(Web3.LAMPORTS_PER_SOL / 2),
    );
  });
});
