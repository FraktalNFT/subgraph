import { BigInt,Address, log } from "@graphprotocol/graph-ts"
import {
    Deposit,
    Withdraw
} from "../generated/FeeSharingSystem/FeeSharingSystem"
import {
  Staked
} from "../generated/schema"

export function handleDeposit(event: Deposit):void {
  let user = event.params.user.toHexString();
  let stakedAmount = event.params.amount;
  let staked = Staked.load(user);
  if(staked == null){
    staked = new Staked(user);
  }

  staked.amount = stakedAmount.plus(staked.amount);
  staked.save();
}



export function handleWithdraw(event: Withdraw):void {
  let user = event.params.user.toHexString();
  let withdrawAmount = event.params.amount;
  let staked = Staked.load(user);
  if(staked == null){
    staked = new Staked(user);
  }

  staked.amount = (staked.amount).minus(withdrawAmount);
  staked.save();
}
