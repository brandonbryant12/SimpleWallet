
require('dotenv').config();
const scryptlib = require('scryptlib');
const { getUtxos, broadcast } = require('../util/utils');
const { toHex, Ripemd160, Sig, PubKey, signTx, bsv, PubKeyHash, buildContractClass } = scryptlib;
const demoContract = require('./contracts/p2pkh_release_desc.json');

const privateKey = new bsv.PrivateKey(process.env.privateKey);
const publicKey = privateKey.publicKey;
const pkh = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer());

const DemoP2PKH = buildContractClass(demoContract);
const demo = new DemoP2PKH(new PubKeyHash(toHex(pkh)));

const utxo = {
  txId: '60022bc372eee03a94df94ed03e8a349ef0e9601f18ac8f3fb25149d53c0b8f2',
  outputIndex: 0,
  script: demo.lockingScript,
  satoshis: 900
};

const tx = new bsv.Transaction().from(utxo)
const context = { tx, inputIndex: 0, inputSatoshis: utxo.satoshis }
tx.addOutput(new bsv.Transaction.Output({
    script: bsv.Script(privateKey.toAddress()),
    satoshis: utxo.satoshis - 100,
}));
const sig = signTx(tx, privateKey, demo.lockingScript, context.inputSatoshis)
const unlockingFunction = demo.unlock(new Sig(toHex(sig)), new PubKey(toHex(publicKey)))

if(unlockingFunction.verify(context).success !== true) throw new Error('Invalid signature');

const unlockingScript = unlockingFunction.toScript();
tx.inputs[0].setScript(unlockingScript);

 ( async () => { 
    const result = await broadcast(tx.toString());
    console.log(tx.toString())
  })();
  