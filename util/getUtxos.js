const http = require('superagent');
const bsv = require('bsv');

async function getUtxos (addressAsString) {
    const address = bsv.Address(addressAsString);
    const url = `https://api.whatsonchain.com/v1/bsv/main/address/${address.toString()}/unspent`
    let utxos  = (await http.get(url)).body;
    return utxos.map((utxo) => {
      return new bsv.Transaction.UnspentOutput({
        address: address,
        txId: utxo.tx_hash,
        outputIndex: utxo.tx_pos,
        amount: utxo.value/1e8,
        script: new bsv.Script(address).toHex(),
      })
    })
  };
   
module.exports = getUtxos;