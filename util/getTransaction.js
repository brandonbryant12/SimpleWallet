const http = require('superagent');
async function getTransaction (txid) {
    const url = `https://api.whatsonchain.com/v1/bsv/main/tx/77b0544730bed6492d91658eda78340b7dea25f5bb332fb5a8979040b3599170/hex`
    let tx  = (await http.get(url)).text;
    return tx;
}

module.exports = getTransaction;