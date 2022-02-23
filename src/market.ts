import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  FraktalMarket,
  Bought,
  OfferMade,
  FraktalClaimed,
  ItemListed,
  SellerPaymentPull,
  OfferVoted,
  OwnershipTransferred,
  FeeUpdated,
  AuctionItemListed,
  AuctionContribute,
  AdminWithdrawFees,
} from "../generated/FraktalMarket/FraktalMarket";
import { FraktalNft, Offer, ListItem, Auction } from "../generated/schema";
import { getUser, getFraktionBalance } from "./helpers";

// // event ItemListed(address owner, address tokenAddress, uint256 price, uint256 amountOfShares);
export function handleItemListed(event: ItemListed): void {
  let fraktalAddress = event.params.tokenAddress;
  let fraktal = FraktalNft.load(fraktalAddress.toHexString())!;
  fraktal.status = "open";
  fraktal.save();
  let senderString = event.params.owner.toHexString();
  let listedItemId = senderString + "-" + fraktalAddress.toHexString();
  let listedItem = ListItem.load(listedItemId);
  if (!listedItem) {
    listedItem = new ListItem(listedItemId);
    listedItem.fraktal = fraktalAddress.toHexString();
    listedItem.seller = senderString;
    listedItem.gains = BigInt.fromI32(0);
  }
  listedItem.price = event.params.price;
  listedItem.shares = event.params.amountOfShares;
  // listedItem.amount = event.params.amountOfShares.times(BigInt.fromString("1000000000000000000"));
  listedItem.save();
}

// // event Bought(address buyer,address seller, address tokenAddress, uint16 numberOfShares);
export function handleBought(event: Bought): void {
  log.debug('Bought {} {} {} {}',[event.params.buyer.toHexString(), event.params.seller.toHexString(), event.params.tokenAddress.toHexString(), event.params.numberOfShares.toString()]);
  let contract = FraktalMarket.bind(event.address);
  let sellerBalanceCall = contract.getSellerBalance(event.params.seller);
  let buyer = getUser(event.params.buyer.toHexString());
  buyer.save();

  let fraktalAddress = event.params.tokenAddress;
  let listedItemString =
    event.params.seller.toHexString() + "-" + fraktalAddress.toHexString();
  let listedItem = ListItem.load(listedItemString)!;
  listedItem.shares = listedItem.shares.minus(event.params.numberOfShares);
  listedItem.gains = listedItem.gains.plus(event.transaction.value);
  listedItem.save();

  // let fraktalString = listedItem.fraktal;
  let seller = getUser(event.params.seller.toHexString());
  // log.warning('seller before after {} {} {} ',[seller.balance.toString(),sellerBalanceCall.toString(),BigInt.fromI32(1337).toString()])
  seller.balance = sellerBalanceCall;
  seller.save();
  // let buyerFraktions = getFraktionBalance(buyer.id, fraktalString);
  // let sellerFraktions = getFraktionBalance(seller.id, fraktalString);
  // // duplicates the buyed items!!
  // log.warning('before buyer {} , seller {}',[buyerFraktions.amount.toString(),sellerFraktions.amount.toString()]);
  // buyerFraktions.amount = buyerFraktions.amount.plus(event.params.numberOfShares);
  // sellerFraktions.amount = sellerFraktions.amount.minus(event.params.numberOfShares);
  // log.warning('after buyer {} , seller {}',[buyerFraktions.amount.toString(),sellerFraktions.amount.toString()]);
  // buyerFraktions.save();
  // sellerFraktions.save();
}

// // event OfferMade(address offerer, address tokenAddress, uint256 value);
export function handleOfferMade(event: OfferMade): void {
  let offererString = event.params.offerer.toHexString();
  let user = getUser(offererString);
  user.save();
  let fraktalString = event.params.tokenAddress.toHexString();
  let offerString = offererString + "-" + fraktalString;
  let offer = Offer.load(offerString);
  if (!offer) {
    offer = new Offer(offerString);
  }
  offer.offerer = offererString;
  offer.fraktal = fraktalString;
  offer.value = event.params.value;
  offer.votes = BigInt.fromI32(0);
  offer.timestamp = event.block.timestamp;
  offer.winner = false;
  offer.save();
  let fraktal = FraktalNft.load(fraktalString)!;
  let totalOffers = fraktal.offers;
  totalOffers.push(offerString);
  fraktal.offers = totalOffers;
  fraktal.save();
}

// // event SellerPaymentPull(address seller, uint256 balance);
export function handleSellerPaymentPull(event: SellerPaymentPull): void {
  let user = getUser(event.params.seller.toHexString());
  user.balance = BigInt.fromI32(0);
  user.save();
}

// event FraktalClaimed(address owner, address tokenAddress);
export function handleFraktalClaimed(event: FraktalClaimed): void {
  let fraktalAddress = event.params.tokenAddress;
  let ownerString = event.params.owner.toHexString();
  let fraktal = FraktalNft.load(fraktalAddress.toHexString())!;
  let offerString = ownerString + "-" + fraktal.id;
  let offer = Offer.load(offerString)!;
  if (offer) {
    offer.value = BigInt.fromI32(0);
    offer.save();
  }
  fraktal.status = "Retrieved";
  fraktal.owner = ownerString;
  // overwrite fraktionbalances of everyone to 0? just an idea!
  fraktal.save();
}

// // OfferVoted(address voter, address offerer, address tokenAddress, bool sold)
export function handleOfferVoted(event: OfferVoted): void {
  if (event.params.sold == true) {
    let fraktal = FraktalNft.load(event.params.tokenAddress.toHexString())!;
    // fraktal.buyer = event.params.offerer.toHexString();
    fraktal.status = "sold";
    fraktal.save();
    let offerString =
      event.params.offerer.toHexString() +
      "-" +
      event.params.tokenAddress.toHexString();
    let offer = Offer.load(offerString)!;
    offer.winner = true;
    offer.save();
  }
  // offer.votes = balance...
}


export function handleAdminWithdrawFees(event: AdminWithdrawFees): void {
}

export function handleAuctionContribute(event: AuctionContribute): void {
  let participant = event.params.participant.toHexString();
  // let tokenAddress = event.params.tokenAddress;
  let seller = event.params.seller.toHexString();
  let sellerNonce = event.params.sellerNonce.toString();
  // let participantContribution = event.params.value;

  let entity = Auction.load(`${seller}-${sellerNonce}`);
  if(entity == null){
    entity = new Auction(`${seller}-${sellerNonce}`);
  }

  let _participants = entity.participants;
  if(_participants)
  _participants.push(participant);

  if(entity){
    entity.participants = _participants;
    entity.save();
  }
}

export function handleAuctionItemListed(event: AuctionItemListed): void {
  let nonceString = event.params.nonce.toString();
  let sellerString = event.params.owner.toHexString();
  let id = sellerString+'-'+nonceString;
  let entity = Auction.load(id);

  if(entity == null){
    entity = new Auction(id);
    entity.auctionReserve = BigInt.fromI32(0);
    entity.participants = [];
  }

  entity.seller = event.params.owner.toHexString();
  entity.fraktal = event.params.tokenAddress.toHexString();
  entity.price = event.params.reservePrice;
  entity.shares = event.params.amountOfShares;
  entity.end = event.params.endTime;
  entity.sellerNonce = event.params.nonce;

  entity.save();
}


export function handleFeeUpdated(event: FeeUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}


// // event FeeUpdated(uint16 newFee);
// // event AdminWithdrawFees(uint256 feesAccrued);
