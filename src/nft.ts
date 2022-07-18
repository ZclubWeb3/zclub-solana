import { PublicKey, Keypair, Connection, Transaction } from '@solana/web3.js';

import {
  getSPLTransferTxs,
  getBurnTxs,
  signAndEncodeTransaction,
  getNFTMintTxs,
  MetadataJson,
} from './utils';

// ==========================================================================
// - MARK: mint
// ==========================================================================

/**
 * Only get the txs and signers. The signature must be operated by caller itself.
 * @param connection
 * @param payer
 * @param destination
 * @param uri
 * @returns
 */
export const getMintTxAndSinger = async (
  connection: Connection,
  payer: Keypair,
  destination: PublicKey,
  metaJSON: MetadataJson,
  mint: Keypair,
) => {
  // 1. get all transactions for nft mint
  const txs = await getNFTMintTxs(
    connection,
    payer,
    destination,
    metaJSON,
    mint,
  );
  return { mint, txs, signers: [payer, mint] };
};

/**
 * Mint NFT to destination
 * @param connection
 * @param payer Fee payer
 * @param destination The address which NFT mint to
 * @param uri NFT metadata uri
 * @returns
 */
export const mint = async (
  connection: Connection,
  payer: Keypair,
  destination: PublicKey,
  metaJSON: MetadataJson,
  nftMint = Keypair.generate(),
) => {
  const { mint, txs, signers } = await getMintTxAndSinger(
    connection,
    payer,
    destination,
    metaJSON,
    nftMint,
  );
  const encodedTx = await signAndEncodeTransaction(connection, txs, signers);
  console.log(
    `NFT Mint: signature=${
      encodedTx.encodedSignature
    } mint=${mint.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );
  return { mint: mint.publicKey, ...encodedTx };
};

/**
 * Batch Mint NFT. list length must be 1, because of the transaction bytes limit.
 * @param connection
 * @param {Object[]}list
 * @param list[].payer Fee payer
 * @param list[].destination The address which NFT mint to
 * @param list[].metaJSON NFT metadata
 * @param showLog
 * @returns
 */
export const batchMint = async (
  connection: Connection,
  list: { payer: Keypair; destination: PublicKey; metaJSON: MetadataJson }[],
  showLog = true,
) => {
  const mintList: string[] = [];
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, destination, metaJSON } of list) {
    // 1. get all transactions for nft mint
    const { mint, txs, signers } = await getMintTxAndSinger(
      connection,
      payer,
      destination,
      metaJSON,
      Keypair.generate(),
    );
    txList.push(...txs);
    signerList.push(...signers);
    mintList.push(mint.publicKey.toBase58());
  }

  // 2. combine and encode transaction
  const encodedTx = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`NFT Batch Mint: signature=${encodedTx.encodedSignature} }`);
  }

  return { mint: mintList, ...encodedTx };
};

// ==========================================================================
// - MARK: transfer
// ==========================================================================

/**
 * Only get the txs and signers. The signature must be operated by caller itself.
 * @param connection
 * @param payer
 * @param source
 * @param mint
 * @param destination
 * @returns
 */
export const getTransferTxAndSigner = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  destination: PublicKey,
) => {
  const txs: Transaction[] = await getSPLTransferTxs(
    connection,
    payer,
    source,
    mint,
    destination,
    BigInt(1),
  );
  return {
    txs,
    signers: [payer, source],
  };
};

/**
 * Transfer from source to destination
 * @param connection
 * @param payer Feepayer
 * @param source The owner of the token
 * @param mint The nft address
 * @param destination Normal wallet address, not the associated address.
 * @returns
 */
export const transfer = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  destination: PublicKey,
) => {
  const encodedTx = await batchTransfer(
    connection,
    [
      {
        payer,
        source,
        mint,
        destination,
      },
    ],
    false,
  );

  console.log(
    `NFT Transfer: signature=${
      encodedTx.encodedSignature
    } mint=${mint.toBase58()} source=${source.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );
  return encodedTx;
};

/**
 * Batch Transfer NFT
 * @param connection
 * @param {Object[]}list
 * @param list[].payer Fee payer
 * @param list[].source The owner of the token
 * @param list[].mint The spl address
 * @param list[].destination  Normal wallet address, not the associated address.
 * @param showLog
 * @returns
 */
export const batchTransfer = async (
  connection: Connection,
  list: {
    payer: Keypair;
    source: Keypair;
    mint: PublicKey;
    destination: PublicKey;
  }[],
  showLog = true,
) => {
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, source, mint, destination } of list) {
    const { txs, signers } = await getTransferTxAndSigner(
      connection,
      payer,
      source,
      mint,
      destination,
    );
    txList.push(...txs);
    signerList.push(...signers);
  }

  const encodedTx = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`NFT Batch Transfer: signature=${encodedTx.encodedSignature}`);
  }

  return encodedTx;
};

// ==========================================================================
// - MARK: burn
// ==========================================================================

/**
 *
 * @param connection
 * @param payer  Feepayer
 * @param source The nft owner
 * @param mint The nft address
 * @returns
 */
export const getBurnTxAndSigner = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
) => {
  const txs: Transaction[] = await getBurnTxs(
    connection,
    payer,
    source,
    mint,
    BigInt(1),
    true, // Need close associated account
  );
  return {
    txs,
    signers: [payer, source],
  };
};

/**
 * Burn NFT from source
 * @param connection
 * @param payer Feepayer
 * @param source The nft owner
 * @param mint The nft address
 * @returns
 */
export const burn = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
) => {
  const encodedSignature = await batchBurn(
    connection,
    [
      {
        payer,
        source,
        mint,
      },
    ],
    false,
  );
  console.log(
    `NFT Burn: signature=${encodedSignature} mint=${mint.toBase58()} source=${source.publicKey.toBase58()}`,
  );
  return encodedSignature;
};

/**
 * Batch burn NFT
 * @param connection
 * @param {Object[]}list
 * @param list[].payer Feepayer
 * @param list[].source The nft owner
 * @param list[].mint  The nft address
 * @param showLog
 * @returns
 */
export const batchBurn = async (
  connection: Connection,
  list: { payer: Keypair; source: Keypair; mint: PublicKey }[],
  showLog = true,
) => {
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, source, mint } of list) {
    const { txs, signers } = await getBurnTxAndSigner(
      connection,
      payer,
      source,
      mint,
    );
    txList.push(...txs);
    signerList.push(...signers);
  }

  // signature transactions
  const encodedTx = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`NFT Batch Burn: signature=${encodedTx.encodedSignature}`);
  }
  return encodedTx;
};

export const getMataData = (connection: Connection) => {};
