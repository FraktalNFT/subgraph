import { BigInt,Address, log } from "@graphprotocol/graph-ts"
import {
  FraktalMarket,
  AdminWithdrawFees,
  Bought,
  OfferMade,
  ERC721Locked,
  ERC721UnLocked,
  ERC1155Locked,
  ERC1155UnLocked,
  FeeUpdated,
  FraktalClaimed,
  ItemListed,
  ItemPriceUpdated,
  Minted,
  OwnershipTransferred,
  SellerPaymentPull,
  Defraktionalized,
  Fraktionalized
} from "../generated/FraktalMarket/FraktalMarket"
import {
  FraktalNft,
  NFTCollateral,
  Offer,
  Revenue,
  ListItem,
  FraktionsBalance,
  User
} from "../generated/schema"
import { FraktalNFT } from '../generated/templates';
import { getUser, getFraktionBalance } from './helpers';




export function handleMinted(event: Minted): void {
  // let marketAddress = Address.fromString("0x8272728b245b3db606768Aad22A9d4E0d6e81fF2");
  let senderString = event.params.creator.toHexString()
  let user = getUser(event.params.creator);
  user.save()
  let market = getUser(event.address);
  market.save()
  let fraktalString = event.params.tokenAddress.toHexString()
  let fraktalNft = new FraktalNft(fraktalString)
  fraktalNft.marketId = event.params.nftId
  fraktalNft.creator = senderString
  fraktalNft.owner = market.id
  fraktalNft.hash = event.params.urlIpfs
  fraktalNft.createdAt = event.block.timestamp
  fraktalNft.transactionHash = event.transaction.hash.toHex()
  fraktalNft.revenues = []
  fraktalNft.offers = []
  fraktalNft.status = 'open'
  fraktalNft.save()
  let fraktionsString = senderString+'-'+fraktalString
  let fraktions = new FraktionsBalance(fraktionsString)
  fraktions.amount = BigInt.fromI32(10000)
  fraktions.nft = fraktalString;
  fraktions.owner = senderString;
  fraktions.locked = BigInt.fromI32(0);
  FraktalNFT.create(event.params.tokenAddress);
  fraktions.save()
}
// event ItemListed(address owner, uint256 tokenId, uint256 price, uint256 amountOfShares);
export function handleItemListed(event: ItemListed): void {
  let fraktalId = event.params.tokenId
  let fraktalIdString = fraktalId.toHexString()
  let senderString = event.params.owner.toHexString()
  let listedItemId = senderString+'-'+fraktalIdString
  let listedItem = ListItem.load(listedItemId)
  if(!listedItem){
      listedItem = new ListItem(listedItemId)
      let contract = FraktalMarket.bind(event.address)
      let fraktalStringCall = contract.try_getFraktalAddress(fraktalId)
      if (fraktalStringCall.reverted) {
        log.info("fraktal retrieval reverted", [])
        // listedItem.fraktal = 'error'
      } else {
        listedItem.fraktal = fraktalStringCall.value.toHexString()
      }
      listedItem.seller = senderString
      listedItem.gains = BigInt.fromI32(0)
  }
  listedItem.price = event.params.price
  listedItem.amount = event.params.amountOfShares
  listedItem.save()
  // fraktions!!
  // should they be handled as in market property?
  // otherwise careful with 'defraktionalize'
}
// event ItemListed(address owner, uint256 tokenId, uint256 price, uint256 amountOfShares);
export function handleItemPriceUpdated(event: ItemPriceUpdated): void {
  let fraktalId = event.params.tokenId
  // let fraktalString = fraktalId.toHexString()
  let ownerString = event.params.owner.toHexString()

  let contract = FraktalMarket.bind(event.address)
  let fraktalStringCall = contract.try_getFraktalAddress(fraktalId)
  if (fraktalStringCall.reverted) {
    log.info("fraktal reverted on item price update", [])
  } else {
    let fraktalString = fraktalStringCall.value.toHexString()
    let listedItemId = ownerString+'-0x'+fraktalId.toString()
    let listedItem = ListItem.load(listedItemId)
    if(listedItem){
      listedItem.price = event.params.newPrice
      listedItem.save()
    }
  }
}
//     event Bought(address buyer,address seller, uint tokenId, uint256 numberOfShares);
export function handleBought(event: Bought): void {
  let contract = FraktalMarket.bind(event.address)
  let buyer = getUser(event.params.buyer)
  buyer.save()
  let fraktalId = event.params.tokenId
  let listedItemString = event.params.seller.toHexString()+'-'+fraktalId.toHexString()
  let listedItem = ListItem.load(listedItemString)

  // let fraktalStringCall = contract.try_getFraktalAddress(fraktalId)
  // if (fraktalStringCall.reverted) {
  //   log.info("fraktion bought and get address was reverted", [])
  //   // listedItem.fraktal = 'error'
  // } else {
  let fraktalString = listedItem.fraktal

  let buyerBalance = getFraktionBalance(buyer.id, fraktalString)
  let sellerString = event.params.seller.toHexString()
  let seller = getUser(event.params.seller)
  let sellerBalance = getFraktionBalance(seller.id,fraktalString)
  buyerBalance.amount += BigInt.fromI32(event.params.numberOfShares)
  sellerBalance.amount -= BigInt.fromI32(event.params.numberOfShares)
  let sellerBalanceCall = contract.getSellerBalance(event.params.seller)
  seller.balance = sellerBalanceCall
  seller.save();
  buyerBalance.save()
  sellerBalance.save()
  listedItem.amount -= BigInt.fromI32(event.params.numberOfShares)
  listedItem.gains += event.transaction.value
  listedItem.save()
  // }
}

// event OfferMade(address offerer, uint256 value);
export function handleOfferMade(event: OfferMade): void {
  let offererString = event.params.offerer.toHexString();
  let user = getUser(event.params.offerer);
  user.save()
  let fraktalString = event.params.tokenAddress.toHexString();
  let offerString = offererString+'-'+fraktalString;
  let offer = Offer.load(offerString)
  if (!offer) {
    offer = new Offer(offerString)
  }
  offer.offerer = offererString;
  offer.fraktal = fraktalString;
  offer.value = event.params.value
  offer.votes = BigInt.fromI32(0)
  offer.save();
  let fraktal = FraktalNft.load(fraktalString)
  let totalOffers = fraktal.offers
  totalOffers.push(offerString)
  fraktal.offers = totalOffers
  fraktal.save()
}

//    event ERC721Locked(address locker, address tokenAddress, address fraktal, uint256 tokenId);
export function handleERC721Locked(event: ERC721Locked): void {
  let importedERC721 = new NFTCollateral(event.params.tokenAddress.toHexString());
  importedERC721.fraktal = event.params.fraktal.toHexString();
  importedERC721.tokenId = event.params.tokenId;
  importedERC721.type = 'ERC721';
  importedERC721.save();
  let balance = new FraktionsBalance(event.params.locker.toHexString()+'-'+event.params.fraktal.toHexString())
  balance.amount = BigInt.fromI32(10000)
  balance.nft = event.params.fraktal.toHexString()
  balance.owner = event.params.locker.toHexString()
  balance.locked = BigInt.fromI32(0)
  balance.save()
  // let marketBalance = FraktionsBalance.load(event.address.toHexString()+'-'+event.params.tokenAddress.toHexString())
  // marketBalance.amount = BigInt.fromI32(0)
  // marketBalance.save()
}
// event ERC721UnLocked(address owner, uint256 tokenId, address collateralNft, uint256 index);
export function handleERC721UnLocked(event: ERC721UnLocked): void {
  let contract = FraktalMarket.bind(event.address)
  let fraktalStringCall = contract.try_getFraktalAddress(event.params.tokenId)
  if (fraktalStringCall.reverted) {
    log.info("fraktal retrieval reverted", [])
  } else {
    let fraktal = FraktalNft.load(fraktalStringCall.value.toHexString())
    if(fraktal){
      fraktal.status = 'deleted'
      fraktal.save()
    }
  }
  let importedERC721 = NFTCollateral.load(event.params.collateralNft.toHexString());
  // importedERC721.fraktal = null;
  importedERC721.tokenId = null;
  importedERC721.save();
}
// event SellerPaymentPull(address seller, uint256 balance);
export function handleSellerPaymentPull(event: SellerPaymentPull): void {
  let user = getUser(event.params.seller)
  user.balance = BigInt.fromI32(0)
  user.save()
}


// event FraktalClaimed(address owner, uint256 tokenId);
export function handleFraktalClaimed(event: FraktalClaimed): void {
  let fraktalId = event.params.tokenId
  // let fraktalString = fraktalId.toHexString()
  let ownerString = event.params.owner.toHexString()

  let contract = FraktalMarket.bind(event.address)
  let fraktalStringCall = contract.try_getFraktalAddress(fraktalId)
  if (fraktalStringCall.reverted) {
    log.info("fraktal reverted on claim", [])
  } else {
    let fraktal = FraktalNft.load(fraktalStringCall.value.toHexString())
    fraktal.status = 'Retrieved'
    // overwrite fraktionbalances of everyone to 0? good idea!
  }
}
// event Defraktionalized(address tokenAddress);
export function handleDefraktionalized(event: Defraktionalized): void {
  let ownerString = event.transaction.from.toHexString()
  let tokenString = event.params.tokenAddress.toHexString()
  let fraktionsString = ownerString+'-'+tokenString
  let fraktions = FraktionsBalance.load(fraktionsString)
  fraktions.amount = BigInt.fromI32(0)
  fraktions.save()
  let fraktal = FraktalNft.load(event.params.tokenAddress.toHexString());
  fraktal.owner = ownerString;
  fraktal.save()
}
// event Fraktionalized(address tokenAddress);
export function handleFraktionalized(event: Fraktionalized): void {
  let ownerString = event.transaction.from.toHexString()
  let user = getUser(event.transaction.from);
  user.save()
  let tokenString = event.params.tokenAddress.toHexString()
  let fraktionsString = ownerString+'-'+tokenString
  let market = getUser(event.address);
  let fraktions = FraktionsBalance.load(fraktionsString)
  fraktions.amount = BigInt.fromI32(10000)
  fraktions.save()
  let fraktal = FraktalNft.load(event.params.tokenAddress.toHexString());
  fraktal.owner = market.id;
  fraktal.save()
}
//    event ERC1155Locked(address locker, address tokenAddress, address fraktal, uint256 tokenId);
export function handleERC1155Locked(event: ERC1155Locked): void {
  let importedERC1155 = new NFTCollateral(event.params.tokenAddress.toHexString());
  importedERC1155.fraktal = event.params.fraktal.toHexString();
  importedERC1155.tokenId = event.params.tokenId;
  importedERC1155.type = 'ERC1155';
  importedERC1155.save();
  let balance = new FraktionsBalance(event.params.locker.toHexString()+'-'+event.params.fraktal.toHexString())
  balance.amount = BigInt.fromI32(10000)
  balance.nft = event.params.fraktal.toHexString()
  balance.owner = event.params.locker.toHexString()
  balance.locked = BigInt.fromI32(0)
  balance.save()
  // let marketBalance = FraktionsBalance.load(event.address.toHexString()+'-'+event.params.tokenAddress.toHexString())
  // marketBalance.amount = BigInt.fromI32(0)
  // marketBalance.save()
}
// event ERC1155UnLocked(address owner, uint256 tokenId, address collateralNft, uint256 index);
export function handleERC1155UnLocked(event: ERC1155UnLocked): void {
  let contract = FraktalMarket.bind(event.address)
  let fraktalStringCall = contract.try_getFraktalAddress(event.params.index)
  if (fraktalStringCall.reverted) {
    log.info("fraktal retrieval reverted", [])
  } else {
    let fraktal = FraktalNft.load(fraktalStringCall.value.toHexString())
    if(fraktal){
      fraktal.status = 'deleted'
      fraktal.save()
    }
  }
  let importedERC1155 = NFTCollateral.load(event.params.collateralNft.toHexString());
  importedERC1155.tokenId = null;
  importedERC1155.save();
}
