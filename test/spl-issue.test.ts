import * as Web3 from '@solana/web3.js';
import BN from 'bn.js';
import { getMint } from '@solana/spl-token';

import * as SPL from '../src/spl';
describe('SPL ISSUE TEST', () => {
  let connection: Web3.Connection;
  const to_keypair = Web3.Keypair.generate();
  let ownerKeypair = Web3.Keypair.generate();

  let mintAHTKeypair = Web3.Keypair.generate();
  let mintAUTKeypair = Web3.Keypair.generate();
  jest.setTimeout(1000000);

  beforeAll(async () => {
    // metadata can be only test on the public network. because localhost network has no metadata relevant programId
    connection = new Web3.Connection(Web3.clusterApiUrl('devnet'), 'confirmed');

    await connection.confirmTransaction(
      await connection.requestAirdrop(
        ownerKeypair.publicKey,
        Web3.LAMPORTS_PER_SOL,
      ),
    );

    await connection.confirmTransaction(
      await connection.requestAirdrop(
        to_keypair.publicKey,
        Web3.LAMPORTS_PER_SOL,
      ),
    );
  });
  test('AHT', async () => {
    console.log(ownerKeypair.publicKey.toBase58());
    // amount = 100M
    const amount = BigInt(
      new BN('100,000,000'.replace(/,/gi, ''))
        .mul(new BN('1,000,000,000'.replace(/,/gi, '')))
        .toString(),
    );
    const encodedTx = await SPL.issueSPLToken(
      connection,
      ownerKeypair,
      ownerKeypair,
      mintAHTKeypair,
      9,
      amount,
      {
        name: 'Ave Hamilton Token',
        symbol: 'AHT',
        uri: 'https://arweave.net/BXkn80Rhz2YdotjgoODcUmVYJh1AaiRRf2ChEjz038U',
      },
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );

    const mintInfo = await getMint(connection, mintAHTKeypair.publicKey);
    console.log(mintInfo);
    expect(mintInfo.supply).toEqual(amount);

    const balance1 = await SPL.getBalance(
      connection,
      mintAHTKeypair.publicKey,
      ownerKeypair.publicKey,
    );

    expect(balance1).toEqual(amount);
  });

  test('AUT', async () => {
    // amount = 1B
    const amount = BigInt(
      new BN('1,000,000,000'.replace(/,/gi, ''))
        .mul(new BN('1,000,000,000'.replace(/,/gi, '')))
        .toString(),
    );
    const encodedTx = await SPL.issueSPLToken(
      connection,
      ownerKeypair,
      ownerKeypair,
      mintAUTKeypair,
      9,
      amount,
      {
        name: 'Ave University Token',
        symbol: 'AUT',
        uri: 'https://arweave.net/0pvXzUcAiEyg3KUntRhPAtZr-xzOvpOLoJdfnrcocAg',
      },
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );

    const mintInfo = await getMint(connection, mintAUTKeypair.publicKey);
    console.log(mintInfo);
    expect(mintInfo.supply).toEqual(amount);

    const balance1 = await SPL.getBalance(
      connection,
      mintAUTKeypair.publicKey,
      ownerKeypair.publicKey,
    );

    expect(balance1).toEqual(amount);
  });

  test('transfer', async () => {
    const amount = BigInt(new BN('500').mul(new BN('1000000000')).toString());
    const encodedTx = await SPL.transfer(
      connection,
      ownerKeypair,
      ownerKeypair,
      mintAHTKeypair.publicKey,
      to_keypair.publicKey,
      amount,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    const balance2 = await SPL.getBalance(
      connection,
      mintAHTKeypair.publicKey,
      to_keypair.publicKey,
    );
    expect(balance2).toEqual(amount);
  });

  test('burn', async () => {
    const amount = BigInt(new BN('500').mul(new BN('1000000000')).toString());
    const encodedTx = await SPL.burn(
      connection,
      to_keypair,
      to_keypair,
      mintAHTKeypair.publicKey,
      amount,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    const balance2 = await SPL.getBalance(
      connection,
      ownerKeypair.publicKey,
      to_keypair.publicKey,
    );
    expect(balance2).toEqual(BigInt(0));
  });
});
