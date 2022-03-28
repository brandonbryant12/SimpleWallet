require('dotenv').config();
const scryptlib = require('scryptlib');
const { toHex, bsv, PubKeyHash, buildContractClass, signTx, PubKey } = scryptlib;
const p2pkhABI = require('../../scrypt/contracts/p2pkh_release_desc.json');
const P2PKHContract = buildContractClass(p2pkhABI);

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


class PayToPublicKeyHashOwner {

  constructor(ownerPrivateKey) {
      this.ownerPrivateKey = new bsv.PrivateKey(ownerPrivateKey);
      const pkh = bsv.crypto.Hash.sha256ripemd160(this.ownerPrivateKey.publicKey.toBuffer());
      this.contractInstance = new P2PKHContract(new PubKeyHash(toHex(pkh)));
  }
  async nextOwner () { 
    return new SmartContractLock(this.contractInstance.lockingScript.toHex());
  }

  async sign (rawtx, parents, locks) {
    const unlockingTx = bsv.Transaction(rawtx);
    console.log(unlockingTx)
    unlockingTx.inputs
    .forEach((input, n) => {
      if(locks[n] && locks[n].lockingScript === this.contractInstance.lockingScript.toHex()){
        const sig = signTx(unlockingTx, this.ownerPrivateKey, this.contractInstance.lockingScript, parents[n].satoshis)
        input.setScript(this.contractInstance.unlock(sig, new PubKey(toHex(this.ownerPrivateKey.publicKey))).toScript())
      }
    })
    return unlockingTx;
  }

  static lockingScript(contractInstance) {
    return contractInstance.lockingScript.toHex();
  }
  ownerPrivateKey; 

  contractInstance;
}

module.exports = PayToPublicKeyHashOwner;