require('dotenv').config();
const scryptlib = require('scryptlib');
const { getUtxos, broadcast } = require('../util/utils');
const { toHex, Ripemd160, Sig, PubKey, signTx, bsv } = scryptlib;

const pk = new bsv.PrivateKey(process.env.privateKey);
const publicKey = pk.publicKey;
const pubKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer());
const contractDescription = require('./contracts/p2pkh_release_desc.json');

const sigHashType = bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_FORKID;
const P2PKHContractClass = scryptlib.buildContractClass(contractDescription);
const instance = new P2PKHContractClass(new Ripemd160(toHex(pubKeyHash)));

const lockingScript = instance.lockingScript;
const lockingScriptASM = lockingScript.toASM();
const lockingScriptHex = lockingScript.toHex();

console.log('locking script', lockingScriptHex)

//Spending tx
const utxo = {
  txId: 'd81525e2d305b4bc53c1bf99abef580b0872ae92b0f0c6405b78acdfdddc3ac9',
  outputIndex: 0,
  script: '',   // placeholder
  satoshis: 9921
};

const tx = newTx(inputSatoshis);
const sig = signTx(tx, pk, instance.lockingScript, inputSatoshis);
const txContext = { inputSatoshis, tx };
instance.txContext = txContext;
const unlockingScriptASM = [toHex(sig), toHex(publicKey)].join(' ');

if(!instance.run_verify(unlockingScriptASM)) throw new Error('invalid unlocking');
if(!instance.unlock(sig, new PubKey(toHex(publicKey))).verify(txContext)) throw new Error('invalid sig');

( async () => { 
   const unlockingScript = bsv.Script(instance.unlock(sig, new PubKey(toHex(publicKey))).toHex());
   const signature = bsv.Transaction.Signature({
       publicKey,
       prevTxId: utxo.txId,
       outputIndex: utxo.outputIndex,
       inputIndex: 0,
       signature: bsv.crypto.Signature.fromTxFormat(Buffer.from(sig.value,'hex')),
       sigtype: 65,
   });
   signature.nhashtype = 65;
   console.log(bsv.crypto.Signature.fromTxFormat(Buffer.from(sig.value,'hex')))
   if(!tx.verifySignature(signature, publicKey, 0, unlockingScript, bsv.crypto.BN.fromNumber(inputSatoshis), 65)) throw new Error('invalid sig')

    tx.addOutput(new bsv.Transaction.Output({
        script: instance.lockingScript,
        satoshis: inputSatoshis - tx._estimateFee(),
    }));

    // const result = await broadcast(tx.toString());
    // console.log(result)
  })();