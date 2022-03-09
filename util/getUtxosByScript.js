const http = require('superagent');
const bsv = require('bsv');

async function getUtxosByScript (scriptAsString) {
    const url = `https://api.whatsonchain.com/v1/bsv/main/script/${scriptAsString}/unspent`
    let utxos  = (await http.get(url)).body;
    return utxos.map((utxo) => {
      return new bsv.Transaction.UnspentOutput({
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        amount: utxo.value/1e8,
        script: scriptAsString,
      })
    })
  };
   
module.exports = getUtxosByScript;