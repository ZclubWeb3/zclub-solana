import { PublicKey, Keypair, Connection, Transaction } from '@solana/web3.js';

import {
  getSPLTransferTxs,
  getBurnTxs,
  signAndEncodeTransaction,
  getNFTMintTxs,
} from './utils';

/**
 * Mint NFT to destination
 * @param connection
 * @param payer
 * @param destination
 * @param uri
 * @returns
 */
export const mint = async (
  connection: Connection,
  payer: Keypair,
  destination: PublicKey,
  uri: string,
) => {
  // 1. get all transactions for nft mint
  const { mint, txs } = await getNFTMintTxs(
    connection,
    payer,
    destination,
    uri,
  );
  // 2. combine and encode transaction
  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    mint,
  ]);

  console.log(
    `NFT Mint: signature=${encodedSignature} mint=${mint.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );
  return { mint: mint.publicKey.toBase58(), encodedSignature };
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
  const txs: Transaction[] = await getSPLTransferTxs(
    connection,
    payer,
    source,
    mint,
    destination,
    BigInt(1),
  );
  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    source,
  ]);

  console.log(
    `NFT Transfer: signature=${encodedSignature} mint=${mint.toBase58()} source=${source.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );
  return encodedSignature;
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
  const txs: Transaction[] = await getBurnTxs(
    connection,
    payer,
    source,
    mint,
    BigInt(1),
    true,
  );

  // signature transactions
  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    source,
  ]);

  console.log(
    `NFT Burn: signature=${encodedSignature} mint=${mint.toBase58()} source=${source.publicKey.toBase58()}`,
  );
  return encodedSignature;
};
