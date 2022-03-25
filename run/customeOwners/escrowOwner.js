require('dotenv').config();
const scryptlib = require('scryptlib');
const { toHex, bsv, PubKeyHash, buildContractClass, signTx, PubKey, Sha256 } = scryptlib;
const contractABI = require('../../scrypt/contracts/escrow_release_desc.json');
const EscrowContract = buildContractClass(contractABI);

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

  winningPartyPrivateKey;

  aliceAddress;

  bobAddress;

  escrowAddress;

  contractInstance;
}

module.exports = PayToPublicKeyHashOwner;