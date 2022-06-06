import { Connection, Transaction } from '@solana/web3.js';
import type { TransactionSignature, Signer } from '@solana/web3.js';
import { Buffer } from 'buffer';

const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

/**
 * Extract all instructions from transaction list
 * @param transactions
 * @returns
 */
const getCombinedTransaction = (transactions: Transaction[]) => {
  const combinedTransaction = new Transaction();
  transactions.forEach(transaction =>
    transaction.instructions.forEach(instruction => {
      combinedTransaction.add(instruction);
    }),
  );
  return combinedTransaction;
};

/**
 * Sign transactions and encode it as base64, Then some other where can use this final signature
 * @param connection
 * @param txs
 * @param signers
 * @returns
 */
export const signAndEncodeTransaction = async (
  connection: Connection,
  txs: Array<Transaction>,
  signers: Array<Signer>,
): Promise<TransactionSignature> => {
  const transaction = getCombinedTransaction(txs);
  if (transaction.nonceInfo) {
    transaction.sign(...signers);
  } else {
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.sign(...signers);
    if (!transaction.signature) {
      throw new Error('!signature'); // should never happen
    }
  }
  const encodedTransaction = toBuffer(transaction.serialize()).toString(
    'base64',
  );

  return encodedTransaction;
};
