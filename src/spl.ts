import { PublicKey, Keypair, Connection, Transaction } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  AccountLayout,
} from '@solana/spl-token';

import {
  getCreateMintTx,
  getBurnTxs,
  getSPLTransferTxs,
  signAndEncodeTransaction,
  getAssociateAddressOrTx,
  getMintToTx,
} from './utils';

/**
 * Create A SPL Token
 * @param connection
 * @param payer Feepayer
 * @param owner Token Authority belongs to the owner
 * @param token_keypair  SPL Token Keypair, use to custom the mint address
 * @returns
 */
export const create = async (
  connection: Connection,
  payer: Keypair,
  owner: Keypair,
  token_keypair: Keypair = Keypair.generate(),
) => {
  const createMintTx = await getCreateMintTx(
    connection,
    payer,
    owner.publicKey,
    owner.publicKey,
    9,
    token_keypair,
  );
  const encodedSignature = await signAndEncodeTransaction(
    connection,
    [createMintTx],
    [payer, token_keypair],
  );

  console.log(
    `SPL Create: signature=${encodedSignature} mint=${token_keypair.publicKey.toBase58()}`,
  );
  return {
    mint: token_keypair.publicKey.toBase58(),
    encodedSignature,
  };
};

/**
 * Increase SPL Token
 * @param connection
 * @param payer Feepayer
 * @param authority The target SPL Token belongs to
 * @param mint The SPL Token address
 * @param amount
 */
export const mint = async (
  connection: Connection,
  payer: Keypair,
  authority: Keypair,
  mint: PublicKey,
  amount: number | bigint,
) => {
  const txs: Transaction[] = [];
  const associateObj = await getAssociateAddressOrTx(
    connection,
    mint,
    authority.publicKey,
    payer,
  );
  if (associateObj.tx) {
    txs.push(associateObj.tx);
  }
  const mintToTx = getMintToTx(
    mint,
    associateObj.associatedTokenAddress,
    authority.publicKey,
    amount,
  );

  txs.push(mintToTx);

  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    authority,
  ]);

  console.log(
    `SPL Mint: signature=${encodedSignature} mint=${mint.toBase58()} amount=${amount.toString()}`,
  );
  return encodedSignature;
};

/**
 * Transfer from source to destination
 * @param connection
 * @param payer Feepayer
 * @param source The owner of the token
 * @param mint The nft address
 * @param destination Normal wallet address, not the associated address.
 * @param amount decimal=9
 * @returns
 */
export const transfer = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: bigint,
) => {
  const txs: Transaction[] = await getSPLTransferTxs(
    connection,
    payer,
    source,
    mint,
    destination,
    amount,
  );
  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    source,
  ]);

  console.log(
    `SPL Transfer: signature=${encodedSignature} mint=${mint.toBase58()} source=${source.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );

  return encodedSignature;
};

/**
 * Burn SPL from source
 * @param connection
 * @param payer Feepayer
 * @param source The SPL owner
 * @param mint The SPL address
 * @param amount decimal=9
 * @returns
 */
export const burn = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  amount: bigint,
) => {
  const txs: Transaction[] = await getBurnTxs(
    connection,
    payer,
    source,
    mint,
    amount,
    false, // SPL Token need not close associate account
  );

  // signature transactions
  const encodedSignature = await signAndEncodeTransaction(connection, txs, [
    payer,
    source,
  ]);
  console.log(
    `SPL Burn: signature=${encodedSignature} mint=${mint.toBase58()} source=${source.publicKey.toBase58()} amount=${amount.toString()}`,
  );
  return encodedSignature;
};

/**
 *
 * @param connection
 * @param mint mint address
 * @param address normal address. not associated address
 * @returns
 */
export const getBalance = async (
  connection: Connection,
  mint: PublicKey,
  address: PublicKey,
) => {
  // await getAccount(connection);
  let amount = BigInt(0);
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, address);
  try {
    const account = await getAccount(connection, associatedTokenAddress);
    amount = account.amount;
  } catch (error: unknown) {
    console.log(error);
  }
  return amount;
};

export const getAllTokenBalance = async (
  connection: Connection,
  owner: PublicKey,
) => {
  const res: Record<string, bigint> = {};
  const tokenAccounts = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  tokenAccounts.value.forEach(e => {
    const accountInfo = AccountLayout.decode(e.account.data);
    // console.log(`${new PublicKey(accountInfo.mint)}   ${accountInfo.amount}`);
    res[accountInfo.mint.toBase58()] = accountInfo.amount;
  });

  return res;
};
