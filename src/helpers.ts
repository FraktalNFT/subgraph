import { Address, BigInt } from '@graphprotocol/graph-ts';
import { User, FraktionsBalance } from '../generated/schema';
// import { FraktalNFT } from '../types/templates/FraktalNFT/FraktalNFT';

export function getFraktionBalance(ownerString: Address, fraktalString: string): FraktionsBalance {
  let fraktionBalanceString = ownerString.toHexString()+'-'+fraktalString
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

export function getUser(address: Address): User {
  let user = User.load(address.toHexString())
  if (user == null) {
    user = new User(address.toHexString())
    user.balance = BigInt.fromI32(0)
  }
  return user as User;
}
