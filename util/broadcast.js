const http = require('superagent');
async function broadcast(txhex){
    return (await http.post('https://api.whatsonchain.com/v1/bsv/main/tx/raw').send({txhex})).body
  }
  
module.exports = broadcast;