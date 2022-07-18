import { StringPublicKey } from '@metaplex-foundation/mpl-core';
import axios, { AxiosResponse } from 'axios';

export declare type MetaDataJsonCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'vr'
  | 'html';
export declare type MetadataJsonAttribute = {
  trait_type: string;
  value: string;
};
export declare type MetadataJsonCollection = {
  name: string;
  family: string;
};
export declare type MetadataJsonFile = {
  uri: string;
  type: string;
  cdn?: boolean;
};
export declare type MetadataJsonCreator = {
  address: StringPublicKey;
  verified: boolean;
  share: number;
};
export declare type MetadataJsonProperties = {
  files: MetadataJsonFile[];
  category: MetaDataJsonCategory;
  creators: MetadataJsonCreator[];
};
export declare type MetadataJson = {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number;
  image: string;
  animation_url?: string;
  external_url?: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  collection?: {
    verified: boolean;
    key: string;
  };
  properties: MetadataJsonProperties;
};
export declare type Optional<T, K extends keyof T> = Pick<Partial<T>, K> &
  Omit<T, K>;

export const lookup = async (url: string): Promise<MetadataJson> => {
  try {
    const { data } = await axios.get<string, AxiosResponse<MetadataJson>>(url);

    return data;
  } catch {
    throw new Error(`unable to get metadata json from url ${url}`);
  }
};
