import { PublicKey, Keypair, Connection } from '@solana/web3.js';

import { signAndEncodeTransaction, getSOLTransferTx } from './utils';

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
  const transaction = getSOLTransferTx(source.publicKey, destination, amount);
  const encodedSignature = await signAndEncodeTransaction(
    connection,
    [transaction],
    [payer, source],
  );
  console.log(
    `SOL Transfer: signature=${encodedSignature} source=${source.publicKey.toBase58()} destination=${destination.toBase58()} amount=${amount.toString()}`,
  );
  return encodedSignature;
};
