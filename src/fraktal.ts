import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  FraktalNFT,
  LockedSharesForTransfer,
  NewRevenueAdded,
  ItemSold,
  unLockedSharesForTransfer
} from "../generated/templates/FraktalNFT/FraktalNFT"
import {
  FraktalNft,
  Revenue,
  ListItem,
  FraktionsBalance,
  User
} from "../generated/schema"
import { getUser, getFraktionBalance } from './helpers';
// event LockedSharesForTransfer(address shareOwner, address to, uint numShares);
export function handleLockedSharesForTransfer(event: LockedSharesForTransfer): void {
  let idString = event.params.to.toHexString()+'-'+event.address.toHexString();
  let fraktionBalance = getFraktionBalance(event.transaction.from.toHexString(), event.address.toHexString());
  fraktionBalance.locked += event.params.numShares;
  fraktionBalance.save();
}
// event NewRevenueAdded(address payer, address revenueChannel, uint256 amount);
export function handleNewRevenueAdded(event: NewRevenueAdded): void {
  let revenueString = event.address.toHexString()+'-'+event.params.revenueChannel.toHexString();
  let revenueChannel = new Revenue(revenueString);
  revenueChannel.value = event.params.amount;
  revenueChannel.creator = event.params.payer.toHexString();
  revenueChannel.address = event.params.revenueChannel;
  revenueChannel.save();
  let fraktal = FraktalNft.load(event.address.toHexString());
  let revenues = fraktal.revenues
  revenues.push(revenueString)
  fraktal.revenues = revenues
  fraktal.save();
}

// event ItemSold(address buyer); // its not the buyer!!! its the last voter..
export function handleItemSold(event: ItemSold): void {
  let fraktalString = event.address.toHexString();
  let fraktal = FraktalNft.load(fraktalString);
  fraktal.status = 'sold';
  fraktal.save();
}
// event unLockedSharesForTransfer(address shareOwner, address to, uint numShares);
export function handleunLockedSharesForTransfer(event: unLockedSharesForTransfer): void {
  let idString = event.params.to.toHexString()+'-'+event.address.toHexString();
  let fraktionBalance = getFraktionBalance(event.params.to.toHexString(), event.address.toHexString());
  fraktionBalance.locked = BigInt.fromI32(0);
  fraktionBalance.save();
  let contract = FraktalNFT.bind(event.address)
  let marketAddress = Address.fromString("0x8272728b245b3db606768Aad22A9d4E0d6e81fF2");
  let fraktalStringCall = contract.try_balanceOf(marketAddress, BigInt.fromI32(0))
  if (fraktalStringCall.reverted) {
    log.info("reverted on unlocking fraktions", [])
  } else {
    if(fraktalStringCall.value === BigInt.fromI32(1)){
      let fraktal = FraktalNft.load(event.address.toHexString())
      fraktal.owner = marketAddress.toHexString()
      fraktal.save()
    }
  }
}
