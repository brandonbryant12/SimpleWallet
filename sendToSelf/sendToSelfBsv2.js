require('dotenv').config();
const { getUtxos, broadcast } = require('../util/utils');

const bsv2 = require('bsv2');
const { Bn, TxBuilder, Address, Script, KeyPair, TxOut, Sig, Tx, Ecdsa, PubKey } = bsv2;
const pLimit = require('p-limit');
const keyPair = new KeyPair().fromPrivKey(new bsv2.PrivKey().fromString(process.env.privateKey))
const publicKey = keyPair.pubKey;
const address  = new Address().fromPubKey(publicKey);
const DUST = 150;


const calcSighash = (txBuilder, index, input) => {
  const sighash = txBuilder.tx.sighash(
     Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
     index,
     new Address().fromString(address.toString()).toTxOutScript(),
     new Bn(input.satoshis),
     Tx.SCRIPT_ENABLE_SIGHASH_FORKID,
     txBuilder.hashCache,
  ).toString('hex');
  return sighash;
};


const calcSighashes = async  (txBuilder, selectedOutputs) => {
      const limit = pLimit(20);
     return Promise.all(txBuilder.txIns.map((_, index) => limit(() => calcSighash(txBuilder, index, selectedOutputs[index]))));
};



const fillSignatures = (txBuilder, signatures) => {
  signatures.forEach((signature, index) => {
    const script = new Script();
      script.writeBuffer(
        new Sig().fromString(signature.toHex()).toTxFormat(),
    );
    const pubKey = new PubKey().fromString(publicKey.toHex())
    script.writeBuffer(pubKey.toBuffer())
    txBuilder.txIns[index].setScript(script)
  });
  return txBuilder
}

( async () => {

  const utxos = await getUtxos(address.toString());
  const total = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
  if(total < DUST) throw new Error('Not enough funds');

  const txBuilder = new TxBuilder()
  txBuilder.setDust(140);
  txBuilder.setFeePerKbNum(0.25 * 1000);
  txBuilder.outputToAddress(new Bn().fromNumber(total - 1000), address)
  utxos.forEach((utxo) => {
    txBuilder.inputFromPubKeyHash(
      Buffer.from(utxo.txId, 'hex').reverse(),
      utxo.outputIndex,
      new TxOut().fromProperties(new Bn(utxo.satoshis), new Script().fromHex(utxo.script.toHex())),
      undefined, //leave public key blank for now as we don't know it
    )
 })
 txBuilder.setChangeAddress(address);
 txBuilder.sort();
 txBuilder.build({ useAllInputs: true });

const sighashArray = await calcSighashes(txBuilder, utxos);

const sigs = sighashArray.map((sighash, index) => {
  return Ecdsa.sign(Buffer.from(sighash, 'hex'), keyPair, 'little').fromObject({
    nHashType:  Sig.SIGHASH_ALL | Sig.SIGHASH_FORKID,
  })
})

  fillSignatures(txBuilder, sigs)
  const result = await broadcast(txBuilder.tx.toString());
  console.log(result)
})();
