# Simple Wallet 
Basic wallet examples and tools using Bitcoin SV libraries 

## .env
`privateKey="yourPrivateKeyHere"`


### Legacy BSV Node Library 
Send p2pkh example sending a transaction to th
`node node sendToSelf/sendToSelf.js` 

### BSV2 Node Library

`node sendToSelf/sendToSelfBsv2.js `

### Sighash flag examples 
- Crowdfund
Example of using transaction sighash flags to do a crowdfund

### Scrypt
example of creating a non-standard output and spending the output.  Compile `.scrypt` contract, load contract, deploy contract to mainnet and spend back to privateKey address.
`node scrypt/deployAndSpendContract.js`

