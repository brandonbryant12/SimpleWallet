require('dotenv').config();
const PayToPublicKeyHashOwner = require('./customLocks/p2pkhLock');
const Run = require('run-sdk');
const { LocalPurse } = Run.plugins;
const bsv = require('bsv');
const fundPrivateKey = require('../util/fundPrivateKey');

/*
 class Weapon extends Run.Jig {
    upgrade() { this.upgrades = (this.upgrades || 0) + 1; }
    send(address) { this.owner = address; }
 }
 // location: 3bbe2790a6b4cdd6da6cb4bb827c475fe70c52656b78c5dfe224ccfe3f5a19f5_o1
*/
 (async ()=> {
  const blockchain = new Run.plugins.WhatsOnChain({ network: 'main' })
  const run = new Run({
    purse: new LocalPurse({
      privkey : process.env.privateKey,
      blockchain
    }),
    owner: new PayToPublicKeyHashOwner(process.env.privateKey),
  });
  run.trust('*')
  //const Weapon = await run.load('3bbe2790a6b4cdd6da6cb4bb827c475fe70c52656b78c5dfe224ccfe3f5a19f5_o1');
  const sword = await run.load('703a03f77c34810dbb4d1c837f94c3cdfd2aa6c62380e03794fa22ea8f74c1d8_o1');
  sword.send(process.env.address)
  await run.sync();
  console.log(sword);
 })();