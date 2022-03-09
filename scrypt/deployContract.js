require('dotenv').config();
const bsv = require('bsv');
const { getUtxos } = require('../util/utils');
const privateKey =  new bsv.PrivateKey(process.env.privateKey);
const address = privateKey.toAddress()

async function deployContract(contract, amount) {
  const tx = new bsv.Transaction()
  const utxos = await getUtxos(address);
  const transformed = utxos.map((utxo) => ({
    txId: utxo.txId,
    outputIndex: utxo.outputIndex,
    satoshis: utxo.satoshis,
    script: bsv.Script.buildPublicKeyHashOut(address).toHex(),
  }))
  tx.from(utxos)
  .addOutput(new bsv.Transaction.Output({
    script: contract.lockingScript,
    satoshis: amount,
  }))
  .change(address)
  .sign(privateKey)
  return tx
}

module.exports = deployContract;