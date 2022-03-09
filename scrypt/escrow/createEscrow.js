
require('dotenv').config();
const scryptlib = require('scryptlib');
const { broadcast, getUtxos, fundPrivateKey } = require('../../util/utils');
const spendContract = require('../callContract');
const escrowDesc = require('../contracts/escrow_release_desc.json');
const deployContract = require('../deployContract');

const {
    bsv,
    buildContractClass,
    PubKey,
    getPreimage,
    PubKeyHash,
    Sig,
    signTx,
    toHex,
    Sha256, 
    Bytes,
    SigHashPreimage,
  } = require('scryptlib');
  
const escrowPrivateKey = new bsv.PrivateKey(process.env.privateKey);
const alicePrivateKey = new bsv.PrivateKey(process.env.alicePrivateKey);
const bobPrivateKey = new bsv.PrivateKey(process.env.bobPrivateKey);

const publicKeyAlice = alicePrivateKey.publicKey;
const publicKeyBob = bobPrivateKey.publicKey;
const publicKeyEscrow = escrowPrivateKey.publicKey;

const alicePkh = bsv.crypto.Hash.sha256ripemd160(publicKeyAlice.toBuffer());
const bobPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyBob.toBuffer());
const escrowPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyEscrow.toBuffer());

const secretBuf1 = Buffer.from("abc");
const hashSecret1 = bsv.crypto.Hash.sha256(secretBuf1);

const secretBuf2 = Buffer.from("def");
const hashSecret2 = bsv.crypto.Hash.sha256(secretBuf2);

const Signature = bsv.crypto.Signature
const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID

const Escrow = buildContractClass(escrowDesc);
const escrowAmount = 2000;
const fee = 500;
const escrow = new Escrow(new PubKeyHash(toHex(alicePkh)), new PubKeyHash(toHex(bobPkh)), new PubKeyHash(toHex(escrowPkh)), new Sha256(toHex(hashSecret1)), new Sha256(toHex(hashSecret2)));

( async () => {

  await fundPrivateKey(escrowAmount + fee, escrowPrivateKey);
  let availableUtxos = await getUtxos(escrowPrivateKey.toAddress().toString());
  const { utxos, missingAmount}  = availableUtxos.reduce((obj, utxo) => {
      if(obj.missingAmount > 0) {
        obj.utxos.push(utxo);
        obj.missingAmount = obj.missingAmount - utxo.satoshis;
      }
      return obj
  }, {
      utxos: [],
      missingAmount: escrowAmount + fee,
  });
  if(missingAmount > 0) throw new Error('Insufficent funds');

  const tx =  new bsv.Transaction().from(utxos);
  //Deploy
  const contractTx = await deployContract(escrow, escrowAmount);
  const broadcastRes = await broadcast(contractTx.toString());
  console.log(broadcastRes)
})()
