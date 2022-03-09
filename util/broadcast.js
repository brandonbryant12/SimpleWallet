const http = require('superagent');
async function broadcast(txhex){
    try{
        return (await http.post('https://api.whatsonchain.com/v1/bsv/main/tx/raw').send({txhex})).body
    }
    catch(err){
        return err.response.body;
    }
}
  
module.exports = broadcast;