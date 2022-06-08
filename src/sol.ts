import { PublicKey, Keypair, Connection, Transaction } from '@solana/web3.js';

import { signAndEncodeTransaction, getSOLTransferTx } from './utils';

// ==========================================================================
// - MARK: transfer
// ==========================================================================

/**
 * Only get the txs and signers. The signature must be operated by caller itself.
 * @param payer
 * @param source
 * @param destination
 * @param amount
 * @returns
 */
export const getTransferTxAndSigner = async (
  payer: Keypair,
  source: Keypair,
  destination: PublicKey,
  amount: number | bigint,
) => {
  const transaction = getSOLTransferTx(source.publicKey, destination, amount);
  return {
    txs: [transaction],
    signers: [payer, source],
  };
};

/**
 * Transfer SOL
 * @param connection
 * @param payer Fee payer
 * @param source transfer from the source
 * @param destination transfer to
 * @param amount lamports amount, decimal=9
 * @returns signature string (base64)
 */
export const transfer = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  destination: PublicKey,
  amount: number | bigint,
) => {
  const encodedSignature = await batchTransfer(
    connection,
    [
      {
        payer,
        source,
        destination,
        amount,
      },
    ],
    false,
  );
  console.log(
    `SOL Transfer: signature=${encodedSignature} source=${source.publicKey.toBase58()} destination=${destination.toBase58()} amount=${amount.toString()}`,
  );
  return encodedSignature;
};

/**
 * Batch Transfer SOL
 * @param connection
 * @param {Object[]} list
 * @param list[].payer Fee payer
 * @param list[].source transfer from the source
 * @param list[].destination transfer to
 * @param list[].amount lamports amount, decimal=9
 * @param {Boolean} showLog
 * @returns signature string (base64)
 */
export const batchTransfer = async (
  connection: Connection,
  list: {
    payer: Keypair;
    source: Keypair;
    destination: PublicKey;
    amount: number | bigint;
  }[],
  showLog = true,
) => {
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, source, destination, amount } of list) {
    const { txs, signers } = await getTransferTxAndSigner(
      payer,
      source,
      destination,
      amount,
    );
    txList.push(...txs);
    signerList.push(...signers);
  }
  const encodedSignature = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`SOL Batch Transfer: signature=${encodedSignature}`);
  }

  return encodedSignature;
};

// ==========================================================================
// - MARK: balance
// ==========================================================================

/**
 * Get SOL balance
 * @param connection
 * @param address
 * @returns 1 lamport = 0.000000001SOL
 */
export const getBalance = async (
  connection: Connection,
  address: PublicKey,
) => {
  return BigInt(await connection.getBalance(address));
};
