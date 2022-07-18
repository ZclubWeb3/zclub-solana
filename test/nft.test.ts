import * as Web3 from '@solana/web3.js';

import { NFT, SPL, signAndEncodeTransaction, MetadataJson } from '../src';
import { requestAirdrop } from './util';

const getMetadata = (creatorAddress: string, collectionAddress?: string) => {
  return {
    name: collectionAddress
      ? `Chair Dev #${Math.floor(Math.random() * 100)}`
      : 'Chair Collection',
    symbol: '',
    uri: '',
    sellerFeeBasisPoints: 400,
    creators: [
      {
        share: 100,
        address: creatorAddress,
      },
    ],
    collection: collectionAddress
      ? { key: collectionAddress, verified: false }
      : undefined,
  } as MetadataJson;
};

const mintANFT = async (
  connection: Web3.Connection,
  keypair: Web3.Keypair,
  metaJSON: MetadataJson,
) => {
  const { encodedSignature, mint } = await NFT.mint(
    connection,
    keypair,
    keypair.publicKey,
    metaJSON,
    Web3.Keypair.generate(),
  );
  await connection.confirmTransaction(
    await connection.sendEncodedTransaction(encodedSignature),
  );
  return mint;
};
describe('NFT TEST', () => {
  let connection: Web3.Connection;

  let collection_chair_address: Web3.PublicKey;
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
  });

  test('mint collection NFT', async () => {
    console.log(keypair1.publicKey.toBase58());
    collection_chair_address = await mintANFT(
      connection,
      keypair1,
      getMetadata(keypair1.publicKey.toBase58()),
    );

    console.log(collection_chair_address.toBase58());
  });

  test('mint chairs 1', async () => {
    mint_chair_address_batch_test1 = await mintANFT(
      connection,
      keypair1,

      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
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
  });

  test('mint chairs 2-6', async () => {
    mint_chair_address_batch_test2 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test3 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test4 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test5 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test6 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
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
    mint_chair_address_batch_test1 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test2 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test3 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test4 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test5 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );
    mint_chair_address_batch_test6 = await mintANFT(
      connection,
      keypair1,
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
    );

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
      getMetadata(
        keypair1.publicKey.toBase58(),
        collection_chair_address.toBase58(),
      ),
      Web3.Keypair.generate(),
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
});
