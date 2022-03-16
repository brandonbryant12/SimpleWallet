const http = require('superagent');
async function getTransaction (txid) {
    const url = `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    let tx  = (await http.get(url)).text;
    return tx;
}

module.exports = getTransaction;