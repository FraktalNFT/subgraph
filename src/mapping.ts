import { BigInt } from "@graphprotocol/graph-ts"
import {
  FraktalMarket,
  AdminWithdrawFees,
  Bought,
  Defraktionalized,
  ERC1155Locked,
  ERC1155UnLocked,
  ERC721Locked,
  ERC721UnLocked,
  FeeUpdated,
  FraktalClaimed,
  FraktalProtocolUpgraded,
  Fraktionalized,
  ItemListed,
  ItemPriceUpdated,
  Minted,
  OfferMade,
  OwnershipTransferred,
  RevenuesProtocolUpgraded,
  SellerPaymentPull
} from "../generated/FraktalMarket/FraktalMarket"
import { ExampleEntity } from "../generated/schema"

export function handleAdminWithdrawFees(event: AdminWithdrawFees): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new ExampleEntity(event.transaction.from.toHex())

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.feesAccrued = event.params.feesAccrued

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.Fraktalimplementation(...)
  // - contract.fee(...)
  // - contract.getERC1155Collateral(...)
  // - contract.getERC721Collateral(...)
  // - contract.getFee(...)
  // - contract.getFraktalAddress(...)
  // - contract.getFraktalsLength(...)
  // - contract.getListingAmount(...)
  // - contract.getListingPrice(...)
  // - contract.getOffer(...)
  // - contract.getSellerBalance(...)
  // - contract.getVotes(...)
  // - contract.importERC1155(...)
  // - contract.importERC721(...)
  // - contract.listItem(...)
  // - contract.lockedERC1155indexes(...)
  // - contract.lockedERC1155s(...)
  // - contract.lockedERC721indexes(...)
  // - contract.lockedERC721s(...)
  // - contract.maxPriceRegistered(...)
  // - contract.mint(...)
  // - contract.offers(...)
  // - contract.onERC1155BatchReceived(...)
  // - contract.onERC1155Received(...)
  // - contract.onERC721Received(...)
  // - contract.owner(...)
  // - contract.revenueChannelImplementation(...)
  // - contract.sellersBalance(...)
  // - contract.supportsInterface(...)
  // - contract.withdrawAccruedFees(...)
  // - contract.zeroAddress(...)
}


export function handleBought(event: Bought): void {
  // event Bought(address buyer,address seller, uint tokenId, uint numberOfShares);
    let fraktalId = event.params.tokenId + BigInt.fromI32(1)
    let fraktalString = fraktalId.toHexString()
    let buyerString = event.params.buyer.toHexString()
    let user = User.load(buyerString)
    if (user == null) {
      user = new User(buyerString)
      user.balance = BigInt.fromI32(0)
      user.save()
    }
    let sellerString = event.params.seller.toHexString()
    let buyerBalance = FraktionsBalance.load(buyerString+'-'+fraktalString)
    if (buyerBalance == null) {
      buyerBalance = new FraktionsBalance(buyerString+'-'+fraktalString)
      buyerBalance.amount = BigInt.fromI32(0)
      buyerBalance.nft = fraktalString
      buyerBalance.owner = buyerString
    }
    let sellerBalance = FraktionsBalance.load(sellerString+'-'+fraktalString)
    buyerBalance.amount += event.params.numberOfShares
    sellerBalance.amount -= event.params.numberOfShares
    let sellerUser = User.load(sellerString)
    let listedItemId = sellerString+'-'+fraktalString
    let listedItem = ListItem.load(listedItemId)
    let value = event.params.numberOfShares * listedItem.price
    sellerUser.balance += value
    listedItem.balance += value
    listedItem.amount -= event.params.numberOfShares

    buyerBalance.save()
    sellerBalance.save()
    sellerUser.save()
    listedItem.save()
}

// export function handleBought(event: Bought): void {}

export function handleDefraktionalized(event: Defraktionalized): void {}

export function handleERC1155Locked(event: ERC1155Locked): void {}

export function handleERC1155UnLocked(event: ERC1155UnLocked): void {}

export function handleERC721Locked(event: ERC721Locked): void {}

export function handleERC721UnLocked(event: ERC721UnLocked): void {}

export function handleFeeUpdated(event: FeeUpdated): void {}

export function handleFraktalClaimed(event: FraktalClaimed): void {}

export function handleFraktalProtocolUpgraded(
  event: FraktalProtocolUpgraded
): void {}

export function handleFraktionalized(event: Fraktionalized): void {}

export function handleItemListed(event: ItemListed): void {
  // event ItemListed(address owner,uint256 tokenId, uint256 price, uint256 amountOfShares, string typeList);
    let fraktalId = event.params.tokenId + BigInt.fromI32(1)
    let fraktalString = fraktalId.toHexString()
    let senderString = event.params.owner.toHexString()
    let listedItemId = senderString+'-'+fraktalString

    let listedItem = new ListItem(listedItemId)
    listedItem.fraktal = fraktalString
    listedItem.seller = senderString
    listedItem.balance = BigInt.fromI32(0)
    listedItem.price = event.params.price
    listedItem.amount = event.params.amountOfShares
    listedItem.type = event.params.typeList
    listedItem.save()
}
// export function handleItemListed(event: ItemListed): void {}


export function handleItemPriceUpdated(event: ItemPriceUpdated): void {
  // event ItemPriceUpdated(address owner, uint256 tokenId, uint256 newPrice);
    let fraktalId = event.params.tokenId + BigInt.fromI32(1)
    let fraktalString = fraktalId.toHexString()
    let ownerString = event.params.owner.toHexString()

    let listedItemId = ownerString+'-'+fraktalString
    let listedItem = ListItem.load(listedItemId)
    if(listedItem){
      listedItem.price = event.params.newPrice
      listedItem.save()
    }
}
// export function handleItemPriceUpdated(event: ItemPriceUpdated): void {}

export function handleMinted(event: Minted): void {
  let senderString = event.params.creator.toHexString()
  let user = User.load(senderString)
  if (user == null) {
    user = new User(senderString)
    user.balance = BigInt.fromI32(0)
  }
  let fraktalString = event.params.nftId.toHexString()
  let fraktalNft = new FraktalNFT(fraktalString)
  fraktalNft.marketId = event.params.nftId - BigInt.fromI32(1)
  fraktalNft.creator = senderString
  fraktalNft.owner = senderString
  fraktalNft.hash = event.params.urlIpfs
  let fraktionsString = senderString+'-'+fraktalString
  let fraktions = new FraktionsBalance(fraktionsString)
  fraktions.amount = BigInt.fromI32(10000)
  fraktions.owner = senderString
  fraktions.nft = fraktalString
  fraktalNft.createdAt = event.block.timestamp
  fraktalNft.transactionHash = event.transaction.hash.toHex()
  fraktions.save()
  fraktalNft.save()
  user.save()
}
// export function handleMinted(event: Minted): void {}

export function handleOfferMade(event: OfferMade): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRevenuesProtocolUpgraded(
  event: RevenuesProtocolUpgraded
): void {}

export function handleSellerPaymentPull(event: SellerPaymentPull): void {}
