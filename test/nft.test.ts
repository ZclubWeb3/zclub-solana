import * as Web3 from '@solana/web3.js';
import express from 'express';
import http from 'http';

import { NFT, SPL, signAndEncodeTransaction } from '../src';
import JsonChair from './fixtures/json/chair.json';
import JsonRoom from './fixtures/json/room.json';
import { requestAirdrop, sleep } from './util';
const mockServer = (creater: Web3.PublicKey) => {
  const app = express();
  const port = 3000;

  app.get('/api/jsonroom', (req, res) => {
    JsonRoom.properties.creators = [
      {
        address: creater.toBase58(),
        share: 100,
      },
    ];
    res.json(JsonRoom);
  });

  app.get('/api/jsonchair', (req, res) => {
    JsonChair.properties.creators = [
      {
        address: creater.toBase58(),
        share: 100,
      },
    ];
    res.json(JsonChair);
  });

  const server = app.listen(port, () => {
    console.log(`mock app listening on port ${port}`);
  });

  return server;
};

const mintANFT = async (connection: Web3.Connection, keypair: Web3.Keypair) => {
  const { encodedSignature, mint } = await NFT.mint(
    connection,
    keypair,
    keypair.publicKey,
    'http://127.0.0.1:3000/api/jsonchair',
  );
  await connection.confirmTransaction(
    await connection.sendEncodedTransaction(encodedSignature),
  );
  return mint;
};
describe('NFT TEST', () => {
  let server: http.Server;
  let connection: Web3.Connection;

  let mint_chair_address_batch_test1: Web3.PublicKey;
  let mint_chair_address_batch_test2: Web3.PublicKey;
  let mint_chair_address_batch_test3: Web3.PublicKey;
  let mint_chair_address_batch_test4: Web3.PublicKey;
  let mint_chair_address_batch_test5: Web3.PublicKey;
  let mint_chair_address_batch_test6: Web3.PublicKey;
  let keypair1 = Web3.Keypair.generate();
  let keypair2 = Web3.Keypair.generate();
  jest.setTimeout(10000000);

  beforeAll(async () => {
    // nft can be only test on the public network. because localhost network has no metadata relevant programId
    connection = new Web3.Connection(Web3.clusterApiUrl('devnet'), 'confirmed');
    await requestAirdrop(connection, keypair1.publicKey, 1);
    server = mockServer(keypair1.publicKey);
  });

  test('mint chairs', async () => {
    mint_chair_address_batch_test1 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test2 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test3 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test4 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test5 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test6 = await mintANFT(connection, keypair1);
    expect(
      await SPL.getBalance(
        connection,
        mint_chair_address_batch_test1,
        keypair1.publicKey,
      ),
    ).toEqual(BigInt(1));
    const allInfo = await SPL.getAllTokenBalance(
      connection,
      keypair1.publicKey,
    );
    expect(allInfo[mint_chair_address_batch_test1.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allInfo[mint_chair_address_batch_test2.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allInfo[mint_chair_address_batch_test3.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allInfo[mint_chair_address_batch_test4.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allInfo[mint_chair_address_batch_test5.toBase58()]).toEqual(
      BigInt(1),
    );
  });

  test('transfer', async () => {
    const encodedTx = await NFT.transfer(
      connection,
      keypair1,
      keypair1,
      mint_chair_address_batch_test1,
      keypair2.publicKey,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    expect(
      await SPL.getBalance(
        connection,
        mint_chair_address_batch_test1,
        keypair1.publicKey,
      ),
    ).toEqual(BigInt(0));
    expect(
      await SPL.getBalance(
        connection,
        mint_chair_address_batch_test1,
        keypair2.publicKey,
      ),
    ).toEqual(BigInt(1));
  });

  test('batch transfer', async () => {
    const encodedTx = await NFT.batchTransfer(connection, [
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair2.publicKey,
        mint: mint_chair_address_batch_test2,
      },
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair2.publicKey,
        mint: mint_chair_address_batch_test3,
      },
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair2.publicKey,
        mint: mint_chair_address_batch_test4,
      },
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair2.publicKey,
        mint: mint_chair_address_batch_test5,
      },
      {
        payer: keypair1,
        source: keypair1,
        destination: keypair2.publicKey,
        mint: mint_chair_address_batch_test6,
      },
    ]);
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    const allTokenInfo = await SPL.getAllTokenBalance(
      connection,
      keypair2.publicKey,
    );
    expect(allTokenInfo[mint_chair_address_batch_test2.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allTokenInfo[mint_chair_address_batch_test3.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allTokenInfo[mint_chair_address_batch_test4.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allTokenInfo[mint_chair_address_batch_test5.toBase58()]).toEqual(
      BigInt(1),
    );
    expect(allTokenInfo[mint_chair_address_batch_test6.toBase58()]).toEqual(
      BigInt(1),
    );
  });
  test('burn', async () => {
    const encodedTx = await NFT.burn(
      connection,
      keypair1,
      keypair2,
      mint_chair_address_batch_test1,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    expect(
      await SPL.getBalance(
        connection,
        mint_chair_address_batch_test1,
        keypair2.publicKey,
      ),
    ).toEqual(BigInt(0));
  });
  test('batch burn', async () => {
    const encodedTx = await NFT.batchBurn(connection, [
      {
        payer: keypair1,
        source: keypair2,
        mint: mint_chair_address_batch_test2,
      },
      {
        payer: keypair1,
        source: keypair2,
        mint: mint_chair_address_batch_test3,
      },
      {
        payer: keypair1,
        source: keypair2,
        mint: mint_chair_address_batch_test4,
      },
      {
        payer: keypair1,
        source: keypair2,
        mint: mint_chair_address_batch_test5,
      },
      {
        payer: keypair1,
        source: keypair2,
        mint: mint_chair_address_batch_test6,
      },
    ]);
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx.encodedSignature),
    );
    const allTokenInfo = await SPL.getAllTokenBalance(
      connection,
      keypair2.publicKey,
    );

    expect(allTokenInfo[mint_chair_address_batch_test2.toBase58()]).toEqual(
      undefined,
    );
    expect(allTokenInfo[mint_chair_address_batch_test3.toBase58()]).toEqual(
      undefined,
    );
    expect(allTokenInfo[mint_chair_address_batch_test4.toBase58()]).toEqual(
      undefined,
    );
    expect(allTokenInfo[mint_chair_address_batch_test5.toBase58()]).toEqual(
      undefined,
    );
    expect(allTokenInfo[mint_chair_address_batch_test6.toBase58()]).toEqual(
      undefined,
    );
  });

  test('batch burn & mint', async () => {
    mint_chair_address_batch_test1 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test2 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test3 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test4 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test5 = await mintANFT(connection, keypair1);
    mint_chair_address_batch_test6 = await mintANFT(connection, keypair1);

    const burnList = [
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test1,
      },
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test2,
      },
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test3,
      },
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test4,
      },
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test5,
      },
      {
        payer: keypair1,
        source: keypair1,
        mint: mint_chair_address_batch_test6,
      },
    ];
    const txList: Web3.Transaction[] = [];
    const signerList: Web3.Keypair[] = [];
    // 1. combine burn
    for (const { payer, source, mint } of burnList) {
      const { txs, signers } = await NFT.getBurnTxAndSigner(
        connection,
        payer,
        source,
        mint,
      );
      txList.push(...txs);
      signerList.push(...signers);
    }
    // 2. combine nft mint
    const { mint, signers, txs } = await NFT.getMintTxAndSinger(
      connection,
      keypair1,
      keypair1.publicKey,
      'http://127.0.0.1:3000/api/jsonchair',
    );
    txList.push(...txs);
    signerList.push(...signers);

    // 3. signature
    try {
      await signAndEncodeTransaction(connection, txList, signerList);
    } catch (e) {
      const t = () => {
        throw e;
      };
      expect(t).toThrowError(/Transaction too large/);
    }
  });

  afterAll(() => {
    server.close();
  });
});
