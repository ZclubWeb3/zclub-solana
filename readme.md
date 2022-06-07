# Zclub Solana

The javascript SDK for Solana with the most common use cases!

## Install

```sh
npm install @zclubweb3/zclub-solana

# or 

yarn add @zclubweb3/zclub-solana
```

## Test

All the test cases is dependent on sepecial solana network.

1. `localhost`: It's fast, but you must hava the solana localhost environment.
2. `network`: It's a bit slow, but more easy without localhost environment.

### Network(localhost)

1. Install solana cli tools: Please refer to [offical document](https://docs.solana.com/cli/install-solana-cli-tools).
2. Set the localhost network

    ```sh
      solana config set --url localhost
    ```

3. Run the solana test validator

    ```sh
      solana-test-validator
    ```

### Network(devnet)

The nft section must be test on devnet, because the localhost network has no metadata relevent programs.

```sh
  npm run test
```

## Usage

All the usages can be find in test folder.

### SOL

1. query amount
2. transfer

### SPL

1. query amount
2. mint
3. transfer
4. burn

### NFT(a special SPL)

NFT is a special SPL Token in Solana!

1. mint
2. transfer
3. burn
