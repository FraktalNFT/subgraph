import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { FraktalNft, User, ListItem, FraktionsBalance, Offer, Revenue } from '../generated/schema';
// import { FraktalNFT } from '../types/templates/FraktalNFT/FraktalNFT';

export function getFraktionBalance(ownerString: string, fraktalString: string): FraktionsBalance {
  let fraktionBalanceString = ownerString+'-'+fraktalString
  let fraktionBalance = FraktionsBalance.load(fraktionBalanceString)
  if (fraktionBalance == null) {
    fraktionBalance = new FraktionsBalance(fraktionBalanceString)
    fraktionBalance.amount = BigInt.fromI32(0)
    fraktionBalance.locked = BigInt.fromI32(0)
    fraktionBalance.nft = fraktalString
    fraktionBalance.owner = ownerString
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
