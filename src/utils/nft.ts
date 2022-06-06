/**
 * This file refers to metaplex/js and encapsulats the @metaplex-foundation.
 * We don't send the transction immediately in our logical, so we can't use the metaplex/js directly.
 */

import { PublicKey, Connection, Keypair, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import BN from 'bn.js';
import {
  CreateMasterEdition,
  CreateMetadata,
  Creator,
  MasterEdition,
  Metadata,
  MetadataDataData,
} from '@metaplex-foundation/mpl-token-metadata';

import { lookup } from '../adaptor/metaplex';
import { getCreateMintTx, getMintToTx } from './public';

export interface MintNFTParams {
  connection: Connection;
  wallet: Keypair;
  uri: string;
  maxSupply?: number;
}

export interface MintNFTResponse {
  txId: string;
  mint: PublicKey;
  metadata: PublicKey;
  edition: PublicKey;
}

interface MintTxs {
  mint: Keypair;
  // recipient ATA
  recipient: PublicKey;
  createMintTx: Transaction;
  createAssociatedTokenAccountTx: Transaction;
  mintToTx: Transaction;
}

export const prepareTokenAccountAndMintTxs = async (
  connection: Connection,
  owner: PublicKey,
  payer: Keypair,
): Promise<MintTxs> => {
  const mint = Keypair.generate();
  const createMintTx = await getCreateMintTx(
    connection,
    payer,
    owner,
    owner,
    0,
    mint,
  );
  const recipient = await getAssociatedTokenAddress(mint.publicKey, owner);
  const createAssociatedTokenAccountTx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      recipient,
      owner,
      mint.publicKey,
    ),
  );
  const mintToTx = getMintToTx(mint.publicKey, recipient, owner, 1);
  return {
    mint,
    createMintTx,
    createAssociatedTokenAccountTx,
    mintToTx,
    recipient,
  };
};

/**
 * Get all txs for mint a nft
 * @param connection
 * @param payer tx payer
 * @param owner nft owenr
 * @param uri the uri of the metadata
 * @param maxSupply default = 1
 * @returns
 */
export const getNFTMintTxs = async (
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  uri: string,
  maxSupply = 1,
) => {
  const { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx } =
    await prepareTokenAccountAndMintTxs(connection, owner, payer);

  const metadataPDA = await Metadata.getPDA(mint.publicKey);
  const editionPDA = await MasterEdition.getPDA(mint.publicKey);

  const {
    name,
    symbol,
    seller_fee_basis_points,
    properties: { creators },
  } = await lookup(uri);

  const creatorsData = creators.reduce<Creator[]>(
    (memo, { address, share }) => {
      const verified = address === owner.toString();

      const creator = new Creator({
        address,
        share,
        verified,
      });

      memo = [...memo, creator];

      return memo;
    },
    [],
  );

  const metadataData = new MetadataDataData({
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: seller_fee_basis_points,
    creators: creatorsData,
  });

  const createMetadataTx = new CreateMetadata(
    {
      feePayer: payer.publicKey,
    },
    {
      metadata: metadataPDA,
      metadataData,
      updateAuthority: owner,
      mint: mint.publicKey,
      mintAuthority: owner,
    },
  );

  const masterEditionTx = new CreateMasterEdition(
    { feePayer: payer.publicKey },
    {
      edition: editionPDA,
      metadata: metadataPDA,
      updateAuthority: owner,
      mint: mint.publicKey,
      mintAuthority: owner,
      maxSupply: maxSupply || maxSupply === 0 ? new BN(maxSupply) : undefined,
    },
  );

  return {
    mint,
    txs: [
      createMintTx,
      createMetadataTx,
      createAssociatedTokenAccountTx,
      mintToTx,
      masterEditionTx,
    ],
  };
};
