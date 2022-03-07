import { BigInt, Address, store } from "@graphprotocol/graph-ts";
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
import { getUser, getFraktionBalance, getFraktal } from "./helpers";
import { log } from "matchstick-as/assembly/log"

// // event ItemListed(address owner, address tokenAddress, uint256 price, uint256 amountOfShares);
export function handleItemListed(event: ItemListed): void {
  let fraktalId = event.params.tokenAddress.toHexString()
  let fraktal = getFraktal(fraktalId)
  let owner = getUser(event.params.owner.toHexString())
  let price = event.params.price
  let shares = event.params.amountOfShares
  let id = owner.id + "-" + fraktal.id
  let item = ListItem.load(id)
  // Delisting item when price and shares are both zero
  // let delisting = price.isZero() && shares.isZero() && item !== null

  // if(delisting) {
  //   store.remove("ListItem", id)
  // } else {
  if(item == null) {
    item = new ListItem(id)
    // item.gains = BigInt.fromI32(0)
  }
  item.seller = owner.id
  item.fraktal = fraktal.id
  item.price = price
  item.shares = shares
  item.save()

  // nft.status = delisting ? "closed" : "open"
  fraktal.status = "open"
  fraktal.save()
}

// // event Bought(address buyer,address seller, address tokenAddress, uint16 numberOfShares);
export function handleBought(event: Bought): void {
  log.debug('Bought {} {} {} {}',[
    event.params.buyer.toHexString(), 
    event.params.seller.toHexString(), 
    event.params.tokenAddress.toHexString(), 
    event.params.numberOfShares.toString()
  ]);
  let contract = FraktalMarket.bind(event.address);
  let sellerBalanceCall = contract.getSellerBalance(event.params.seller);
  let buyer = getUser(event.params.buyer.toHexString());
  buyer.save();

  let fraktal = getFraktal(event.params.tokenAddress.toHexString())
  let seller = getUser(event.params.seller.toHexString())

  let listedItemId = seller.id + "-" + fraktal.id
  let listedItem = ListItem.load(listedItemId)
  if (listedItem == null) {
    listedItem = new ListItem(listedItemId)
    listedItem.seller = seller.id
    listedItem.fraktal = event.params.tokenAddress.toHexString()
  }
  listedItem.shares = listedItem.shares.minus(event.params.numberOfShares);
  listedItem.gains = listedItem.gains.plus(event.transaction.value);
  listedItem.save();
  

  // let fraktalString = listedItem.fraktal;
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
  let user = getUser(event.params.offerer.toHexString());
  user.save();
  let fraktal = getFraktal(event.params.tokenAddress.toHexString());
  // TODO: this id has a collision when offerer sells and wants to buy back
  let offerId = user.id + "-" + fraktal.id;
  let offer = Offer.load(offerId);
  if (offer == null) {
    offer = new Offer(offerId);
  }
  offer.offerer = user.id;
  offer.fraktal = fraktal.id;
  offer.value = event.params.value;
  // offer.votes = BigInt.fromI32(0);
  // offer.winner = false;
  offer.tx = event.transaction.hash
  offer.block = event.block.number
  offer.created = event.block.timestamp;
  offer.updated = event.block.timestamp;
  offer.save();

  let totalOffers = fraktal.offers;
  totalOffers.push(offerId);
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
  let owner = getUser(event.params.owner.toHexString())
  let fraktal = getFraktal(event.params.tokenAddress.toHexString());
  fraktal.status = "Retrieved";
  fraktal.owner = owner.id;
  // TODO: overwrite fraktionbalances of everyone to 0? just an idea!
  fraktal.save();
}

// // OfferVoted(address voter, address offerer, address tokenAddress, bool sold)
export function handleOfferVoted(event: OfferVoted): void {
  let fraktal = getFraktal(event.params.tokenAddress.toHexString())
  let offerer = getUser(event.params.offerer.toHexString())
  
  fraktal.status = "sold";
  fraktal.save();
  
  let offerId = offerer.id + "-" + fraktal.id
  let offer = Offer.load(offerId)
  if (offer == null) {
    offer = new Offer(offerId)
    offer.fraktal = fraktal.id
    offer.offerer = offerer.id
  }

  offer.voter = event.params.voter.toHexString()
  offer.winner = event.params.sold
  offer.updated = event.block.timestamp
  offer.save()
}


export function handleAdminWithdrawFees(event: AdminWithdrawFees): void {
}

export function handleAuctionContribute(event: AuctionContribute): void {
  let participant = event.params.participant.toHexString();
  let seller = event.params.seller.toHexString();
  let sellerNonce = event.params.sellerNonce.toString();
  // let participantContribution = event.params.value;

  getFraktal(event.params.tokenAddress.toHexString())

  let auction = Auction.load(`${seller}-${sellerNonce}`);
  if(auction == null){
    auction = new Auction(`${seller}-${sellerNonce}`);
  }
  
  let _participants = auction.participants;
  _participants.push(participant);
  auction.participants = _participants;
  
  auction.seller = seller
  auction.sellerNonce = event.params.sellerNonce
  auction.save()
}

export function handleAuctionItemListed(event: AuctionItemListed): void {
  let nonceString = event.params.nonce.toString();
  let owner = getUser(event.params.owner.toHexString())
  let id = owner.id + "-" + nonceString
  
  let fraktalId = event.params.tokenAddress.toHexString()
  let fraktal = getFraktal(fraktalId)

  let auction = Auction.load(id);
  if(auction == null) {
    auction = new Auction(id);
  }

  auction.seller = owner.id
  auction.fraktal = fraktal.id
  auction.price = event.params.reservePrice;
  auction.shares = event.params.amountOfShares;
  auction.end = event.params.endTime;
  auction.sellerNonce = event.params.nonce;
  auction.save();
}


export function handleFeeUpdated(event: FeeUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}


// // event FeeUpdated(uint16 newFee);
// // event AdminWithdrawFees(uint256 feesAccrued);
