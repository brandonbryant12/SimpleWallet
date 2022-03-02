const bsv = require('bsv');
require('dotenv').config();
const pk = new bsv.PrivateKey(process.env.privateKey);
const publicKey = pk.publicKey;
const address  = publicKey.toAddress();
const sigHashType = bsv.crypto.Signature.SIGHASH_ALL | bsv.crypto.Signature.SIGHASH_FORKID
const { getUtxos, broadcast } = require('../util/utils');
const DUST = 150;

( async () => {
  const utxos = await getUtxos(address);
  const total = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);

  if(total < DUST) throw new Error('Not enough funds');

  const tx = new bsv.Transaction();
  utxos.map((utxo) => tx.from(utxo));
  tx.to(address.toString(), total - tx._estimateFee());
  let sigs = tx.getSignatures(pk, sigHashType);
  sigs.map((sig) => tx.applySignature(sig));
  const result = await broadcast(tx.toString());
  console.log(result)
})();
