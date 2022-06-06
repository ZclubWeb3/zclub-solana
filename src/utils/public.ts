import {
  createCloseAccountInstruction,
  createTransferInstruction,
  createBurnInstruction,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  Account,
  createMintToInstruction,
} from '@solana/spl-token';
import {
  PublicKey,
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  Signer,
} from '@solana/web3.js';

/**
 * Generate SOL transfer tx
 * @param source source publickey
 * @param destination  destination publickey
 * @param amount lamports
 * @returns
 */
export const getSOLTransferTx = (
  source: PublicKey,
  destination: PublicKey,
  amount: number | bigint,
) => {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: source,
      toPubkey: destination,
      lamports: amount,
    }),
  );
  return transaction;
};

/**
 * Get SPL Token create transaction
 * @param connection
 * @param payer
 * @param mintAuthority Minting authority
 * @param freezeAuthority Optional authority that can freeze token accounts
 * @param decimals Number of decimals in token account amounts
 * @param keypair
 * @param programId
 * @returns
 */
export const getCreateMintTx = async (
  connection: Connection,
  payer: Signer,
  mintAuthority: PublicKey,
  freezeAuthority: PublicKey | null,
  decimals: number,
  keypair = Keypair.generate(),
  programId = TOKEN_PROGRAM_ID,
): Promise<Transaction> => {
  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: keypair.publicKey,
      space: MINT_SIZE,
      lamports,
      programId,
    }),
    createInitializeMintInstruction(
      keypair.publicKey,
      decimals,
      mintAuthority,
      freezeAuthority,
      programId,
    ),
  );
  return transaction;
};

/**
 * Generate MintTo transaction
 * @param mint         Public key of the mint
 * @param destination  Associated Address of the token account to mint to
 * @param authority    The mint authority
 * @param amount       Amount to mint
 * @returns
 */
export const getMintToTx = (
  mint: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  amount: number | bigint,
) => {
  const mintToTx = new Transaction().add(
    createMintToInstruction(mint, destination, authority, amount),
  );
  return mintToTx;
};

/**
 * Try to get account info. or new a transaction to create associatedAccount
 * @param connection
 * @param mint
 * @param owner
 * @param payer
 * @returns
 */
export const getAssociateAddressOrTx = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: Keypair,
) => {
  const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);
  const res: {
    associatedTokenAddress: PublicKey;
    account?: Account;
    tx?: Transaction;
  } = {
    associatedTokenAddress,
  };
  try {
    res.account = await getAccount(connection, associatedTokenAddress);
  } catch (error: unknown) {
    res.tx = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        associatedTokenAddress,
        owner,
        mint,
      ),
    );
  }
  return res;
};

/**
 * Transfer Token from source to destination
 * @param connection
 * @param payer Feepayer
 * @param source The owner of the token
 * @param mint The nft address
 * @param destination Normal wallet address, not the associated address.
 * @param amount nft amount is a fixed number 1, other spl token must be careful with the token decimal(defalut is 9)
 * @returns
 */
export const getSPLTransferTxs = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: bigint,
) => {
  const txs: Transaction[] = [];
  // 1. calculate the source associateAddress of the nft
  const sourceAssociatedObj = await getAssociateAddressOrTx(
    connection,
    mint,
    source.publicKey,
    payer,
  );
  if (sourceAssociatedObj.tx) {
    txs.push(sourceAssociatedObj.tx);
  }
  // 2. calculate the destination associateAddress of the nft
  const destinationAssociatedObj = await getAssociateAddressOrTx(
    connection,
    mint,
    destination,
    payer,
  );
  if (destinationAssociatedObj.tx) {
    txs.push(destinationAssociatedObj.tx);
  }
  // 3. construct the transfer transaction
  const transferTx = new Transaction().add(
    createTransferInstruction(
      sourceAssociatedObj.associatedTokenAddress,
      destinationAssociatedObj.associatedTokenAddress,
      source.publicKey,
      amount,
    ),
  );

  txs.push(transferTx);

  return txs;
};

/**
 * Burn Token from source
 * @param connection
 * @param payer Feepayer
 * @param source The Token owner
 * @param mint The Token address
 * @param amout nft amount is a fixed number 1, other spl token must be careful with the token decimal(default is 9)
 * @param close  close the associatedAccount. If the mint is a nft address, the close should be true.
 * @returns
 */
export const getBurnTxs = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  amount: bigint,
  close = false,
) => {
  const txs: Transaction[] = [];
  // 1. calculate the source's associateAddress of the nft
  const sourceAssociatedObj = await getAssociateAddressOrTx(
    connection,
    mint,
    source.publicKey,
    payer,
  );
  if (sourceAssociatedObj.tx) {
    txs.push(sourceAssociatedObj.tx);
  }
  // 2. construct the burn transaction
  const burnTx = new Transaction().add(
    createBurnInstruction(
      sourceAssociatedObj.associatedTokenAddress,
      mint,
      source.publicKey,
      amount,
    ),
  );
  txs.push(burnTx);

  if (close) {
    // 3. construct close account transaction
    const closeTx = new Transaction().add(
      createCloseAccountInstruction(
        sourceAssociatedObj.associatedTokenAddress,
        source.publicKey,
        source.publicKey,
      ),
    );
    txs.push(closeTx);
  }

  return txs;
};
