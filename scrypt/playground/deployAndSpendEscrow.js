
require('dotenv').config();
const scryptlib = require('scryptlib');
const { broadcast, getUtxos } = require('../util/utils');
const spendContract = require('./callContract');
const escrowDesc = require('./contracts/escrow_release_desc.json');
const deployContract = require('./deployContract');

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
const fee = 200;
//init contract
const escrow = new Escrow(new PubKeyHash(toHex(alicePkh)), new PubKeyHash(toHex(bobPkh)), new PubKeyHash(toHex(escrowPkh)), new Sha256(toHex(hashSecret1)), new Sha256(toHex(hashSecret2)));

const utxo = {
    txId: '8bc5d9b4988ad775ed8e64e8fae4898226b034468caf560e2381d92463bdfbfb',
    outputIndex: 0,
    script: escrow.lockingScript,
    satoshis: escrowAmount,
};
const tx =  new bsv.Transaction().from(utxo);



// scenario 1: PA + PB

( async () => {

  const changeUtxos = await getUtxos(escrowPrivateKey.toAddress().toString());
  const utxos = [utxo, changeUtxos[0]]
  const tx =  new bsv.Transaction().from(utxos);


    tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut(alicePrivateKey.toAddress()),
        satoshis: escrowAmount / 2,
      }));
    tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut(bobPrivateKey.toAddress()),
        satoshis: escrowAmount / 2,
      }));
      
    const changeAmount =  utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0) - tx._estimateFee() - escrowAmount - 1000;
    tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut(escrowPrivateKey.toAddress()),
        satoshis: changeAmount,
      }));

    sigA = signTx(tx, alicePrivateKey, escrow.lockingScript, escrowAmount);
    sigB = signTx(tx, bobPrivateKey, escrow.lockingScript, escrowAmount);

    const preimage = getPreimage(
        tx,
        escrow.lockingScript,
        escrowAmount,
        0,
        sighashType
      );

    escrow.txContext = {
        tx,
        inputIndex: 0,
        inputSatoshis: escrowAmount,
      };

    const unlockingFunction = escrow.unlock(
        new SigHashPreimage(toHex(preimage)),
        new PubKey(toHex(publicKeyAlice)),
        new Sig(toHex(sigA)),
        new PubKey(toHex(publicKeyBob)),
        new Sig(toHex(sigB)),
        new Bytes(toHex('')),
        new PubKeyHash(toHex(escrowPkh)),
        changeAmount,
      );
      if(unlockingFunction.verify().success !== true) throw new Error(unlockingFunction.error);
      tx.inputs[0].setScript(unlockingFunction.toScript());
      let sigs = tx.getSignatures(escrowPrivateKey, sighashType);
      sigs.map((sig) => tx.applySignature(sig));

     // console.log(tx.toString())
      const broadcastRes = await broadcast(tx.toString());
      console.log(broadcastRes)
      
      //Deploy
      // const contractTx = await deployContract(escrow, inputSatoshis)
      // const broadcastRes = await broadcast(contractTx.toString());
      // console.log(broadcastRes)
})()
