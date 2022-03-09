require('dotenv').config();
const { broadcast } = require('../util/utils');
const { toHex, PubKey, bsv, signTx } = require('scryptlib');
const privateKey =  new bsv.PrivateKey(process.env.privateKey);
const publicKey = privateKey.publicKey; 

function createInputFromPrevTx(tx, outputIndex) {
  const outputIdx = outputIndex || 0
  return new bsv.Transaction.Input({
    prevTxId: tx.id,
    outputIndex: outputIdx,
    script: new bsv.Script(), // placeholder
    output: tx.outputs[outputIdx]
  })
}


function spendContract(p2pkh, lockingTx, amount) {
    const unlockingTx = new bsv.Transaction();
    unlockingTx.addInput(createInputFromPrevTx(lockingTx))
        .setOutput(0, (tx) => {
            const newLockingScript = bsv.Script.buildPublicKeyHashOut(privateKey.toAddress())
            return new bsv.Transaction.Output({
            script: newLockingScript,
            satoshis: amount - tx.getEstimateFee(),
            })
        })
        .setInputScript(0, (tx, output) => {
            const sig = signTx(unlockingTx, privateKey, output.script, output.satoshis)
            return p2pkh.unlock(sig, new PubKey(toHex(publicKey))).toScript()
        })
        .seal()
        return unlockingTx
}

module.exports = spendContract;