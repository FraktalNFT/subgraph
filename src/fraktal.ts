import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  FraktalNFT,
  LockedSharesForTransfer,
  NewRevenueAdded,
  ItemSold,
  TransferSingle,
  Fraktionalized,
  Defraktionalized,
  unLockedSharesForTransfer
} from "../generated/templates/FraktalNFT/FraktalNFT"
import {
  FraktalNft,
  Revenue,
} from "../generated/schema"
import { PaymentSplitterUpgradeable } from '../generated/templates';
import { getUser, getFraktionBalance } from './helpers';

// event LockedSharesForTransfer(address shareOwner, address to, uint numShares);
export function handleLockedSharesForTransfer(event: LockedSharesForTransfer): void {
  let idString = event.params.to.toHexString()+'-'+event.address.toHexString();
  let fraktionBalance = getFraktionBalance(event.transaction.from, event.address.toHexString());
  fraktionBalance.locked += event.params.numShares;
  fraktionBalance.save();
}

// event NewRevenueAdded(address payer, address revenueChannel, uint256 amount, bool sold);
export function handleNewRevenueAdded(event: NewRevenueAdded): void {
  let revenueString = event.params.revenueChannel.toHexString();
  let revenueChannel = new Revenue(revenueString);
  revenueChannel.value = event.params.amount;
  revenueChannel.creator = event.params.payer.toHexString();
  revenueChannel.tokenAddress = event.address;
  revenueChannel.timestamp = event.block.timestamp;

  // revenueChannel.payees = [];
  // revenueChannel.shares = [];
  if(event.params.sold){
    revenueChannel.buyout = event.params.sold;
  } else {
    revenueChannel.buyout = false;
  }
  revenueChannel.save();
  let fraktal = FraktalNft.load(event.address.toHexString());
  let revenues = fraktal.revenues
  revenues.push(revenueString)
  fraktal.revenues = revenues
  fraktal.save();
  PaymentSplitterUpgradeable.create(event.params.revenueChannel);

}

// event ItemSold(address buyer, uint256 indexUsed);
export function handleItemSold(event: ItemSold): void {
  // let fraktalString = event.address.toHexString();
  // let fraktal = FraktalNft.load(fraktalString);
  // // get the offer and set it as winner = true;
  // // let offerString = offererString+'-'+fraktalString;
  // //
  // fraktal.status = 'sold';
  // fraktal.save();
}

// event unLockedSharesForTransfer(address shareOwner, address to, uint numShares);
export function handleunLockedSharesForTransfer(event: unLockedSharesForTransfer): void {
  let idString = event.params.to.toHexString()+'-'+event.address.toHexString();
  let fraktionBalance = getFraktionBalance(event.params.to, event.address.toHexString());
  fraktionBalance.locked = BigInt.fromI32(0);
  fraktionBalance.save();
}
// event Fraktionalized(address holder, address minter, uint256 index);
export function handleFraktionalized(event: Fraktionalized): void {
  let fraktalString = event.address.toHexString();
  let fraktal = FraktalNft.load(fraktalString);
  fraktal.fraktionsIndex = event.params.index;
  fraktal.save();
  let fraktions = getFraktionBalance(event.params.minter, fraktalString)
  fraktions.amount = BigInt.fromI32(10000)
  fraktions.save()
}

// # event Defraktionalized(address holder, uint256 index);
export function handleDefraktionalized(event: Defraktionalized):void{
  let fraktalString = event.address.toHexString();
  let fraktal = FraktalNft.load(fraktalString);
  fraktal.fraktionsIndex = null;
  fraktal.status = 'retrieved';
  fraktal.save();
  let fraktions = getFraktionBalance(event.params.holder, fraktalString)
  fraktions.amount = BigInt.fromI32(0)
  fraktions.save()
}

// event MajorityValueChanged(uint16 newValue);

// TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
export function handleTransferSingle(event: TransferSingle): void {
  // check the sub id, if 0, change the owner of fraktals
  let owner = getUser(event.params.to)
  let fraktal = FraktalNft.load(event.address.toHexString())
  if(event.params.id == BigInt.fromI32(0)){
    fraktal.owner = owner.id;
    fraktal.save();
  }
  else{
    let spender = getUser(event.params.from);
    let spenderFraktions = getFraktionBalance(event.params.from, fraktal.id)
    let ownerFraktions = getFraktionBalance(event.params.to, fraktal.id)
    spenderFraktions.amount -= event.params.value;
    ownerFraktions.amount += event.params.value;
    spenderFraktions.save();
    ownerFraktions.save();
  }
  owner.save()
}
