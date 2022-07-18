import { PublicKey, Keypair, Connection, Transaction } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  AccountLayout,
} from '@solana/spl-token';
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import { findMetadataPda } from '@metaplex-foundation/js';

import {
  getCreateMintTx,
  getBurnTxs,
  getSPLTransferTxs,
  signAndEncodeTransaction,
  getAssociateAddressOrTx,
  getMintToTx,
} from './utils';

/**
 * issue spl token with amount and metadata
 * @param connection
 * @param payer
 * @param owner
 * @param mintKeypair
 * @param decimals
 * @param amount  if decimal is 9, amount 1,000,000,000 represents 1 really
 * @param metadata
 * @returns
 */
export const issueSPLToken = async (
  connection: Connection,
  payer: Keypair,
  owner: Keypair,
  mintKeypair: Keypair = Keypair.generate(),
  decimals = 9,
  amount: number | bigint,
  metadata: { name: string; symbol: string; uri: string },
) => {
  const txList: Transaction[] = [];

  // 1. create mint
  const createMintTx = await getCreateMintTx(
    connection,
    payer,
    owner.publicKey,
    owner.publicKey,
    decimals,
    mintKeypair,
  );
  txList.push(createMintTx);

  // 2. mint to
  const { txs: mintTxs } = await getMintTxAndSigner(
    connection,
    payer,
    owner,
    mintKeypair.publicKey,
    owner.publicKey,
    amount,
  );
  txList.push(...mintTxs);

  // 3. metadata
  const metadataPDA = await findMetadataPda(mintKeypair.publicKey);
  const tokenMetadata = {
    ...metadata,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2;

  txList.push(
    new Transaction().add(
      createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: owner.publicKey,
          payer: payer.publicKey,
          updateAuthority: owner.publicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: tokenMetadata,
            isMutable: true,
          },
        },
      ),
    ),
  );

  const encodedTx = await signAndEncodeTransaction(connection, txList, [
    payer,
    owner,
    mintKeypair,
  ]);

  console.log(
    `issueSPLToken(name=${metadata.name} symbol=${
      metadata.symbol
    } amount=${amount.toString()}): signature=${encodedTx.encodedSignature} }`,
  );

  return encodedTx;
};

// ==========================================================================
// - MARK: create
// ==========================================================================

/**
 * Create A SPL Token
 * @param connection
 * @param payer Feepayer
 * @param owner Token Authority belongs to the owner
 * @param mintKeypair  SPL Token Keypair, use to custom the mint address
 * @returns
 */
export const create = async (
  connection: Connection,
  payer: Keypair,
  owner: Keypair,
  mintKeypair: Keypair = Keypair.generate(),
) => {
  const createMintTx = await getCreateMintTx(
    connection,
    payer,
    owner.publicKey,
    owner.publicKey,
    9,
    mintKeypair,
  );
  const encodeTx = await signAndEncodeTransaction(
    connection,
    [createMintTx],
    [payer, mintKeypair],
  );

  console.log(
    `SPL Create: signature=${
      encodeTx.encodedSignature
    } mint=${mintKeypair.publicKey.toBase58()}`,
  );
  return {
    mint: mintKeypair.publicKey.toBase58(),
    ...encodeTx,
  };
};

// ==========================================================================
// - MARK: mint
// ==========================================================================

/**
 * Only get the txs and signers. The signature must be operated by caller itself.
 * @param connection
 * @param payer
 * @param authority
 * @param mint
 * @param destination
 * @param amount
 * @returns
 */
export const getMintTxAndSigner = async (
  connection: Connection,
  payer: Keypair,
  authority: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: number | bigint,
) => {
  const txs: Transaction[] = [];
  const associateObj = await getAssociateAddressOrTx(
    connection,
    mint,
    destination,
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
  return {
    txs,
    signers: [payer, authority],
  };
};
/**
 * Mint SPL Token
 * @param connection
 * @param payer Feepayer
 * @param authority The SPL Token authority account
 * @param mint The SPL Token address
 * @param destination The SPL Token Mint to
 * @param amount
 */
export const mint = async (
  connection: Connection,
  payer: Keypair,
  authority: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: number | bigint,
) => {
  const { txs, signers } = await getMintTxAndSigner(
    connection,
    payer,
    authority,
    mint,
    destination,
    amount,
  );
  const encodeTx = await signAndEncodeTransaction(connection, txs, signers);
  console.log(
    `SPL Mint: signature=${
      encodeTx.encodedSignature
    } mint=${mint.toBase58()} amount=${amount.toString()}`,
  );
  return encodeTx;
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
 * @param amount
 * @returns
 */
export const getTransferTxAndSigner = async (
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
 * @param mint The spl address
 * @param destination Normal wallet address, not the associated address.
 * @param amount decimal=9
 * @returns encodedSignature(base64)
 */
export const transfer = async (
  connection: Connection,
  payer: Keypair,
  source: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: bigint,
) => {
  const encodeTx = await batchTransfer(
    connection,
    [
      {
        payer,
        source,
        mint,
        destination,
        amount,
      },
    ],
    false,
  );
  console.log(
    `SPL Transfer: signature=${
      encodeTx.encodedSignature
    } mint=${mint.toBase58()} source=${source.publicKey.toBase58()} destination=${destination.toBase58()}`,
  );

  return encodeTx;
};

/**
 * Batch transfer SPL
 * @param connection
 * @param {Object[]} list
 * @param list[].payer Fee payer
 * @param list[].source The owner of the token
 * @param list[].mint The spl address
 * @param list[].destination Normal wallet address, not the associated address.
 * @param list[].amount decimal=9
 * @param {Boolean} showLog
 * @returns {String} encodedSignature(base64)
 */
export const batchTransfer = async (
  connection: Connection,
  list: {
    payer: Keypair;
    source: Keypair;
    mint: PublicKey;
    destination: PublicKey;
    amount: bigint;
  }[],
  showLog = true,
) => {
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, source, mint, destination, amount } of list) {
    const { txs, signers } = await getTransferTxAndSigner(
      connection,
      payer,
      source,
      mint,
      destination,
      amount,
    );
    txList.push(...txs);
    signerList.push(...signers);
  }
  const encodeTx = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`SPL Batch Transfer: signature=${encodeTx.encodedSignature}`);
  }
  return encodeTx;
};

// ==========================================================================
// - MARK: burn
// ==========================================================================

/**
 * Only get the txs and signers. The signature must be operated by caller itself.
 * @param connection
 * @param payer Feepayer
 * @param source The SPL owner
 * @param mint The SPL address
 * @param amount decimal=9
 * @returns
 */
export const getBurnTxAndSigner = async (
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

  return {
    txs,
    signers: [payer, source],
  };
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
  const encodeTx = await batchBurn(
    connection,
    [
      {
        payer,
        source,
        mint,
        amount,
      },
    ],
    false,
  );
  console.log(
    `SPL Burn: signature=${
      encodeTx.encodedSignature
    } mint=${mint.toBase58()} source=${source.publicKey.toBase58()} amount=${amount.toString()}`,
  );
  return encodeTx;
};

/**
 *
 * @param connection
 * @param {Object[]}list
 * @param list[].payer Feepayer
 * @param list[].source The SPL owner
 * @param list[].mint The SPL address
 * @param list[].amount decimal=9
 * @param showLog
 * @returns
 */
export const batchBurn = async (
  connection: Connection,
  list: { payer: Keypair; source: Keypair; mint: PublicKey; amount: bigint }[],
  showLog = true,
) => {
  const txList: Transaction[] = [];
  const signerList: Keypair[] = [];
  for (const { payer, source, mint, amount } of list) {
    const { txs, signers } = await getBurnTxAndSigner(
      connection,
      payer,
      source,
      mint,
      amount,
    );
    txList.push(...txs);
    signerList.push(...signers);
  }
  // signature transactions
  const encodeTx = await signAndEncodeTransaction(
    connection,
    txList,
    signerList,
  );
  if (showLog) {
    console.log(`SPL Batch Burn: signature=${encodeTx.encodedSignature}`);
  }
  return encodeTx;
};

// ==========================================================================
// - MARK: balance
// ==========================================================================

/**
 * Get balance by mint address
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

/**
 * Get all spl token balance
 * @param connection
 * @param owner
 * @returns
 */
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
