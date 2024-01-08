1. build the rust program

- cd src/rust
- run: cargo-build-sbf

2. deploy the rust program

- cd src/rust
- run: solana program deploy target/deploy/rust_boiler.so

3. create your master edition

- cd src/client
- run: npm run createMasterEdition -- <your master edition json>
- ex: npm run createMasterEdition -- test
