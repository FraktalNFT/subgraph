import { Address, BigInt } from '@graphprotocol/graph-ts';
import { User, FraktionsBalance } from '../generated/schema';

export function getFraktionBalance(ownerString: string, fraktalString: string): FraktionsBalance {
  let fraktionBalanceString = ownerString + '-' + fraktalString
  let owner = getUser(ownerString);
  let fraktionBalance = FraktionsBalance.load(fraktionBalanceString)
  if (fraktionBalance == null) {
    fraktionBalance = new FraktionsBalance(fraktionBalanceString)
    fraktionBalance.amount = BigInt.fromI32(0)
    fraktionBalance.locked = BigInt.fromI32(0)
    fraktionBalance.nft = fraktalString
    fraktionBalance.owner = owner.id;
  }
  return fraktionBalance as FraktionsBalance;
}

export function getUser(address: string): User {
  let user = User.load(address)
  if (user == null) {
    user = new User(address)
    user.balance = BigInt.fromI32(0)
  }
  return user as User;
}
