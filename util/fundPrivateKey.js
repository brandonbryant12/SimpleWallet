require('dotenv').config();
const { HandCashConnect } = require('@handcash/handcash-connect');
const handCashConnect = new HandCashConnect('60a40ae9b23d510bb89a5c3d');
const bsv = require('bsv');
const account = handCashConnect.getAccountFromAuthToken(process.env.handcashAuthToken);
const privateKey = bsv.PrivateKey(process.env.privateKey);

async function fundPrivateKey(amountInSats){
    const paymentParameters = {
        description: 'Beer money🍺',
        appAction: 'funding',
        payments: [{ to: privateKey.toAddress().toString(), currencyCode: 'SAT', amount: amountInSats }]
    };
    const paymentResult = await account.wallet.pay(paymentParameters);
    return paymentResult.transactionId;
};

module.exports = fundPrivateKey;