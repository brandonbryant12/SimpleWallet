//Crowd fund 
const bsv = require('bsv');
const http = require('superagent');
const pk = new bsv.PrivateKey('KyvKDDPmQ4st2o3CHVzFyWsCTSY3EmFZfFcZSbocxkNsPPFU7hgM')
const publicKey = pk.publicKey;
const { getUtxos, broadcast } = require('../util/utils');


//creates a transaction with a fixed output and allows inputs to be added
function createCrowdFund(outputs){
  const tx = new bsv.Transaction();
  outputs.map((output) => {
    tx.to(output.address, output.amount);
  })
  return tx;
}

async function addInputsToCrowdFund(crowdFund, privateKey){
  const sigHashType = bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_ANYONECANPAY | bsv.crypto.Signature.SIGHASH_FORKID
  console.log( privateKey.publicKey.toAddress().toString())
  let utxos = await getUtxos(privateKey.publicKey.toAddress()); 
  let amount = 0;
  utxos.map((utxo) => {
    crowdFund.from(utxo)
    amount += utxo.satoshis
  });
  let signatures = crowdFund.getSignatures(pk, sigHashType);
 
  signatures.map((sig) => {
    crowdFund.applySignature(sig);
  })
  return crowdFund;

}

(async () => {
 
  const outputs = [{
    address: pk.publicKey.toAddress().toString(),
    amount: 0.0001*1e8,
  }]
  let crowdFund = createCrowdFund(outputs)  
  crowdFund = await addInputsToCrowdFund(crowdFund, pk)
  const result = await broadcast(crowdFund.serialize())
  console.log(result)
  
})()


