require('dotenv').config();
const { HandCashConnect, Environments } = require('@handcash/handcash-connect');
const handCashConnect = new HandCashConnect(process.env.iaeAppId, Environments.iae);
const pLmit = require('p-limit');

(async () => {
    const limit = pLmit(20);
    const account = handCashConnect.getAccountFromAuthToken(process.env.iaeAuthToken );
    const paymentParameters = {
        description: 'Beer money🍺',
        appAction: 'funding',
        payments: [{ to: 'icee', currencyCode: 'SAT', amount: 200 }]
    };
    await Promise.all(Array(400).fill(400).map(() => limit (async () => {
        const paymentResult = await account.wallet.pay(paymentParameters);
        console.log(paymentResult.transactionId)
    })));
})()
