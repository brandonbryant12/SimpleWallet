
//THIS DOESN'T WORK

require('dotenv').config();
const scryptlib = require('scryptlib');
const { toHex, bsv, PubKeyHash, buildContractClass, signTx, PubKey, Sha256, SigHashPreimage, getPreimage } = scryptlib;
const contractABI = require('../../scrypt/contracts/escrow_release_desc.json');
const EscrowContract = buildContractClass(contractABI);
const Signature = bsv.crypto.Signature
const sighashType = Signature.SIGHASH_ANYONECANPAY | Signature.SIGHASH_ALL | Signature.SIGHASH_FORKID

const escrowPrivateKey = new bsv.PrivateKey(process.env.privateKey);
const alicePrivateKey = new bsv.PrivateKey(process.env.alicePrivateKey);
const bobPrivateKey = new bsv.PrivateKey(process.env.bobPrivateKey);

const publicKeyAlice = alicePrivateKey.publicKey;
const publicKeyBob = bobPrivateKey.publicKey;
const publicKeyEscrow = escrowPrivateKey.publicKey;

const alicePkh = bsv.crypto.Hash.sha256ripemd160(publicKeyAlice.toBuffer());
const bobPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyBob.toBuffer());
const escrowPkh = bsv.crypto.Hash.sha256ripemd160(publicKeyEscrow.toBuffer());
const escrowAmount = 365;


const secretBuf1 = Buffer.from("abc");
const hashSecret1 = bsv.crypto.Hash.sha256(secretBuf1);

const secretBuf2 = Buffer.from("def");
const hashSecret2 = bsv.crypto.Hash.sha256(secretBuf2);

class SmartContractLock {
  constructor(lockingScript){
      this.lockingScript =  lockingScript;
  }
  script () {
      return this.lockingScript;
  }
  domain () { return 1 }

  lockingScript;
}


class EscrowAgent {
    async getAddress(){
        return bsv.PrivateKey(process.env.privateKey).toAddress().toString();
    }

    async sign(){
    }
}

class EscrowOwner {
  constructor(winningPartyPrivateKey, aliceAddress, bobAddress, escrowAddress, aliceSecret, bobSecret) {
      this.aliceAddress = aliceAddress;
      this.bobAddress = bobAddress;
      this.escrowAddress = escrowAddress;
      this.aliceSecret = aliceSecret;
      this.bobSecret = bobSecret;
      this.winningPartyPrivateKey = winningPartyPrivateKey;
      this.contractInstance = new EscrowContract(
            new PubKeyHash(aliceAddress),
            new PubKeyHash(bobAddress),
            new PubKeyHash(escrowAddress),
            new Sha256(aliceSecret),
            new Sha256(bobSecret),
          )
  }

  async nextOwner () { 
    return new SmartContractLock(this.contractInstance.lockingScript.toHex());
  }

  async sign (rawtx, parents, locks) {
    const unlockingTx = bsv.Transaction(rawtx);
    const preimage = getPreimage(
        unlockingTx,
        this.contractInstance.lockingScript,
        273,
        0,
        sighashType
      );

    unlockingTx.inputs
    .forEach((input, n) => {
      if(locks[n] && locks[n].lockingScript === this.contractInstance.lockingScript.toHex()){
     //   input.setScript(this.contractInstance.unlock(sig, new PubKey(toHex(this.ownerPrivateKey.publicKey))).toScript())
        console.log(unlockingTx)
        const changeAmount = 3171;
        const sigA = signTx(tx, alicePrivateKey, this.contractInstance.lockingScript, 273);
        const sigE = signTx(tx, escrowPrivateKey, this.contractInstance.lockingScript, 273);

        const result = this.contractInstance.unlock(
            new SigHashPreimage(toHex(preimage)),
            new PubKey(toHex(publicKeyAlice)),
            new Sig(toHex(sigA)),
            new PubKey(toHex(publicKeyEscrow)),
            new Sig(toHex(sigE)),
            new Bytes(toHex(secretBuf1)),
            new PubKeyHash(toHex(escrowPkh)),
            changeAmount).verify();
      console.log(result)
      }
    })
    return unlockingTx;
  }

  static lockingScript(contractInstance) {
    return contractInstance.lockingScript.toHex();
  }
  ownerPrivateKey;

  winningPartyPrivateKey;

  aliceAddress;

  bobAddress;

  escrowAddress;

  contractInstance;
}

module.exports = EscrowOwner;