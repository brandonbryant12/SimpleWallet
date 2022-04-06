/*
********************* PLAYER 1 ********************
*/
require('dotenv').config();
const Run = require('run-sdk');
const appId = process.env.appId;
const appSecret = process.env.appSecret;
const { HandCashPurse, HandCashOwner, Environments, } = require('@handcash/handcash-connect');
const authToken = process.env.handcashAuthToken;

 class Weapon extends Run.Jig {
    upgrade() { this.upgrades = (this.upgrades || 0) + 1; }
    send(address) { this.owner = address; }
 }

 (async ()=> {
  const handcashPurse = HandCashPurse.fromAuthToken(authToken, Environments.prod, appSecret );
  const handcashOwner = HandCashOwner.fromAuthToken(authToken, Environments.prod, appSecret);

  const run = new Run({
    purse: handcashPurse,
    owner: handcashOwner,
  });
  run.trust('*');
  const WeaponClass = await run.load('5d25f3f6690328170cb515d5cd8714e43b1f9538f0f392edda662ab351faeb23_o1')
  const sword = new WeaponClass();
  await run.sync();
  console.log('Sword', sword);
  sword.upgrade();
  await run.sync();
  console.log('Sword after upgrade', sword);
 })()