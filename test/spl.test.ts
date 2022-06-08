import * as Web3 from '@solana/web3.js';
import BN from 'bn.js';
import { TOKEN_PROGRAM_ID, getMint } from '@solana/spl-token';

import { NFT, SPL } from '../src';
describe('SPL TEST', () => {
  let connection: Web3.Connection;
  let mint1_address: Web3.PublicKey;
  let keypair1 = Web3.Keypair.generate();
  let keypair2 = Web3.Keypair.generate();

  beforeAll(async () => {
    connection = new Web3.Connection('http://localhost:8899', 'confirmed');
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        keypair1.publicKey,
        Web3.LAMPORTS_PER_SOL,
      ),
    );
  });

  test('create', async () => {
    const { encodedSignature, mint } = await SPL.create(
      connection,
      keypair1,
      keypair1,
    );

    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedSignature),
    );
    // console.log('spl token created', mint);
    mint1_address = new Web3.PublicKey(mint);

    const accountInfo = await connection.getAccountInfo(mint1_address);
    // console.log(accountInfo);
    expect(accountInfo?.owner).toEqual(TOKEN_PROGRAM_ID);
    const mintInfo = await getMint(connection, mint1_address);
    // console.log(mintInfo);
    expect(mintInfo.supply).toEqual(BigInt(0));
    expect(mintInfo.decimals).toEqual(9);
    expect(mintInfo.mintAuthority).toEqual(keypair1.publicKey);
  });
  test('mint1', async () => {
    const supply = BigInt(new BN('1000').mul(new BN('1000000000')).toString());
    const encodedTx = await SPL.mint(
      connection,
      keypair1,
      keypair1,
      mint1_address,
      keypair1.publicKey,
      supply,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx),
    );

    const mintInfo = await getMint(connection, mint1_address);
    // console.log(mintInfo);
    expect(mintInfo.supply).toEqual(supply);

    const balance1 = await SPL.getBalance(
      connection,
      mint1_address,
      keypair1.publicKey,
    );

    expect(balance1).toEqual(supply);

    const balance2 = await SPL.getBalance(
      connection,
      mint1_address,
      keypair2.publicKey,
    );
    expect(balance2).toEqual(BigInt(0));
  });
  test('transfer', async () => {
    const amount = BigInt(new BN('500').mul(new BN('1000000000')).toString());
    const encodedTx = await SPL.transfer(
      connection,
      keypair1,
      keypair1,
      mint1_address,
      keypair2.publicKey,
      amount,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx),
    );
    const balance2 = await SPL.getBalance(
      connection,
      mint1_address,
      keypair2.publicKey,
    );
    expect(balance2).toEqual(amount);
  });
  test('get all token blance', async () => {
    const allInfo = await SPL.getAllTokenBalance(
      connection,
      keypair2.publicKey,
    );
    expect(allInfo[mint1_address.toBase58()]).toEqual(
      BigInt(new BN('500').mul(new BN('1000000000')).toString()),
    );
  });
  test('burn', async () => {
    const amount = BigInt(new BN('500').mul(new BN('1000000000')).toString());
    const encodedTx = await SPL.burn(
      connection,
      keypair1,
      keypair1,
      mint1_address,
      amount,
    );
    await connection.confirmTransaction(
      await connection.sendEncodedTransaction(encodedTx),
    );
    const balance2 = await SPL.getBalance(
      connection,
      mint1_address,
      keypair1.publicKey,
    );
    expect(balance2).toEqual(BigInt(0));

    const mintInfo = await getMint(connection, mint1_address);
    expect(mintInfo.supply).toEqual(amount);
  });
});
