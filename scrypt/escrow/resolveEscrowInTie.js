const tx = '9944ff43760b7e694d73c8ad5dbb9da415d3597ae1fd7b23ac0a9b1657152790';

require('dotenv').config();
const scryptlib = require('scryptlib');
const { broadcast, getUtxos, getUtxosByScript } = require('../../util/utils');
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
const fee = 1000;
const escrow = new Escrow(new PubKeyHash(toHex(alicePkh)), new PubKeyHash(toHex(bobPkh)), new PubKeyHash(toHex(escrowPkh)), new Sha256(toHex(hashSecret1)), new Sha256(toHex(hashSecret2)));

const scriptHash = 'e6ccfb9e9eed75860332a22727e42e4d4d46ec13d437b65db16a10c0656f7246';
(async () => {
    const contractUtxos = await getUtxosByScript(scriptHash);
    if(contractUtxos.length === 0) throw new Error('No Escrow found');
    
    const changeUtxos = await getUtxos(escrowPrivateKey.toAddress().toString());
    const utxos = [contractUtxos[0], changeUtxos[0]]
    const tx =  new bsv.Transaction().from(utxos);

    const escrowAmount = contractUtxos[0].satoshis;
    //Split escrow back to Alice and Bob
    tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut(alicePrivateKey.toAddress()),
        satoshis: escrowAmount / 2,
      }));
    tx.addOutput(new bsv.Transaction.Output({
        script: bsv.Script.buildPublicKeyHashOut(bobPrivateKey.toAddress()),
        satoshis: escrowAmount / 2,
      }));

    
    //Send Change amount back to escrow service
    const changeAmount =  utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0) - tx._estimateFee() - escrowAmount - fee;
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

      const broadcastRes = await broadcast(tx.toString());
      console.log(broadcastRes)
})();