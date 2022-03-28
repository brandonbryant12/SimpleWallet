require('dotenv').config();
const EscrowOwner = require('./customOwners/escrowOwner');
const scryptlib = require('scryptlib');
const { toHex, bsv, PubKeyHash, buildContractClass, signTx, PubKey, Sha256, SigHashPreimage, getPreimage } = scryptlib;
const Run = require('run-sdk');
const { LocalPurse } = Run.plugins;
const fundPrivateKey = require('../util/fundPrivateKey');

const escrowPrivateKey = new bsv.PrivateKey(process.env.privateKey);
const alicePrivateKey = new bsv.PrivateKey(process.env.alicePrivateKey);
const bobPrivateKey = new bsv.PrivateKey(process.env.bobPrivateKey);

const publicKeyAlice = alicePrivateKey.publicKey;
const publicKeyBob = bobPrivateKey.publicKey;
const publicKeyEscrow = escrowPrivateKey.publicKey;

const alicePkh = bsv.crypto.Hash.sha256ripemd160(publicKeyAlice.toBuffer());
const bobPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyBob.toBuffer());
const escrowPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyEscrow.toBuffer());

const secretBuf1 = Buffer.from("abc");
const hashSecret1 = bsv.crypto.Hash.sha256(secretBuf1);

const secretBuf2 = Buffer.from("def");
const hashSecret2 = bsv.crypto.Hash.sha256(secretBuf2);

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
    owner: new EscrowOwner(alicePrivateKey, toHex(alicePkh), toHex(bobPkh), toHex(escrowPkh), toHex(hashSecret1), toHex(hashSecret2))
  });
  run.trust('*');
  //const Weapon = await run.load('3bbe2790a6b4cdd6da6cb4bb827c475fe70c52656b78c5dfe224ccfe3f5a19f5_o1');
  const sword = await run.load('9ab29e2479fb8a5d57480c50ee721c7b0652ff7f58a5a5f9154571d27850939c_o1')
  sword.send(alicePrivateKey.toAddress().toString());
  await run.sync();
  console.log(sword);

 })();