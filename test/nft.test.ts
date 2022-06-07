import * as Web3 from '@solana/web3.js';
import express from 'express';
import http from 'http';

import { NFT, SPL } from '../src';
import JsonChair from './fixtures/json/chair.json';
import JsonRoom from './fixtures/json/room.json';

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

describe('NFT TEST', () => {
  let server: http.Server;
  let connection: Web3.Connection;
  let mint_room_address: Web3.PublicKey;
  let mint_chair_address: Web3.PublicKey;
  let keypair1 = Web3.Keypair.generate();
  let keypair2 = Web3.Keypair.generate();
  jest.setTimeout(1000000);

  beforeAll(async () => {
    // nft can be only test on the public network. because localhost network has no metadata relevant programId
    connection = new Web3.Connection(Web3.clusterApiUrl('devnet'), 'confirmed');
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        keypair1.publicKey,
        Web3.LAMPORTS_PER_SOL,
      ),
    );

    server = mockServer(keypair1.publicKey);
  });
  test('mint room', async () => {
    const { encodedSignature, mint } = await NFT.mint(
      connection,
      keypair1,
      keypair1.publicKey,
      'http://127.0.0.1:3000/api/jsonroom',
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedSignature),
    );
    mint_room_address = new Web3.PublicKey(mint);
  });

  test('mint chair', async () => {
    const { encodedSignature, mint } = await NFT.mint(
      connection,
      keypair1,
      keypair1.publicKey,
      'http://127.0.0.1:3000/api/jsonchair',
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedSignature),
    );
    mint_chair_address = new Web3.PublicKey(mint);
  });
  test('get all token blance', async () => {
    const allInfo = await SPL.getAllTokenBalance(
      connection,
      keypair1.publicKey,
    );
    expect(allInfo[mint_room_address.toBase58()]).toEqual(BigInt(1));
    expect(allInfo[mint_chair_address.toBase58()]).toEqual(BigInt(1));
  });

  test('transfer', async () => {
    const encodedTx = await NFT.transfer(
      connection,
      keypair1,
      keypair1,
      mint_room_address,
      keypair2.publicKey,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx),
    );
    expect(
      await SPL.getBalance(connection, mint_room_address, keypair1.publicKey),
    ).toEqual(BigInt(0));
    expect(
      await SPL.getBalance(connection, mint_room_address, keypair2.publicKey),
    ).toEqual(BigInt(1));
  });
  test('burn', async () => {
    const encodedTx = await NFT.burn(
      connection,
      keypair1,
      keypair1,
      mint_chair_address,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx),
    );
    expect(
      await SPL.getBalance(connection, mint_chair_address, keypair1.publicKey),
    ).toEqual(BigInt(0));
  });

  afterAll(() => {
    server.close();
  });
});
