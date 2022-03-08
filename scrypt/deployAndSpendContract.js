
require('dotenv').config();
const scryptlib = require('scryptlib');
const { broadcast } = require('../util/utils');
const deployContract = require('./deployContract');
const spendContract = require('./callContract');
const p2pkh = require('./contracts/p2pkh_release_desc.json');
const { toHex, Ripemd160, Sig, PubKey, signTx, bsv, PubKeyHash, buildContractClass } = scryptlib;

const privateKey = new bsv.PrivateKey(process.env.privateKey);
const publicKey = privateKey.publicKey;
const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer());

const P2PKH = buildContractClass(p2pkh);
const instance = new P2PKH(new PubKeyHash(toHex(pkh)));

const amount = 420;

( async () => {
    let lockingTx;
    lockingTx = await deployContract(instance, amount);
    await broadcast(lockingTx.toString())
    console.log('locking txid:     ', lockingTx.id)

    let spendingTx;
    spendingTx = await spendContract(instance, lockingTx, amount)
    console.log('unlocking txid:     ', spendingTx.id)
    await broadcast(spendingTx.toString())
})()
