import { BigInt,Address, log } from "@graphprotocol/graph-ts"
import {
  ERC721Locked,
  ERC721UnLocked,
  ERC1155Locked,
  ERC1155UnLocked,
  Minted,
} from "../generated/FraktalFactory/FraktalFactory"
import {
  FraktalNft,
  NFTCollateral,
} from "../generated/schema"
import { FraktalNFT } from '../generated/templates';
import { getUser } from './helpers';

// event Minted(address creator,string urlIpfs,address tokenAddress,uint256 nftId);
export function handleMinted(event: Minted): void {
  let senderString = event.params.creator.toHexString()
  let user = getUser(senderString);
  user.save()
  let market = getUser(event.address.toHexString());
  market.save()
  let fraktalString = event.params.tokenAddress.toHexString()
  let fraktalNft = new FraktalNft(fraktalString)
  fraktalNft.marketId = event.params.nftId
  fraktalNft.creator = senderString
  fraktalNft.owner = senderString
  fraktalNft.hash = event.params.urlIpfs
  fraktalNft.createdAt = event.block.timestamp
  fraktalNft.transactionHash = event.transaction.hash.toHex()
  fraktalNft.revenues = []
  fraktalNft.offers = []
  fraktalNft.status = 'open'
  fraktalNft.save()
  FraktalNFT.create(event.params.tokenAddress);
}

// event ERC721Locked(address locker, address tokenAddress, address fraktal, uint256 tokenId);
export function handleERC721Locked(event: ERC721Locked): void {
  let user = getUser(event.params.locker.toHexString());
  user.save()
  let importedERC721 = new NFTCollateral(event.params.tokenAddress.toHexString());
  // fraktal.collateral = importedERC721.id;
  // fraktal.save();
  let fraktal = FraktalNft.load(event.params.fraktal.toHexString());
  importedERC721.fraktal = fraktal.id;
  importedERC721.tokenId = event.params.tokenId;
  importedERC721.type = 'ERC721';
  importedERC721.save();
}
// event ERC1155Locked(address locker, address tokenAddress, address fraktal, uint256 tokenId);
export function handleERC1155Locked(event: ERC1155Locked): void {
  let user = getUser(event.params.locker.toHexString());
  user.save()
  let importedERC1155 = new NFTCollateral(event.params.tokenAddress.toHexString());
  // fraktal.collateral = importedERC1155.id;
  // fraktal.save();
  let fraktal = FraktalNft.load(event.params.fraktal.toHexString());
  importedERC1155.fraktal = fraktal.id;
  importedERC1155.tokenId = event.params.tokenId;
  importedERC1155.type = 'ERC1155';
  importedERC1155.save();
}
// event ERC721UnLocked(address owner, uint256 tokenId, address collateralNft, uint256 index);
export function handleERC721UnLocked(event: ERC721UnLocked): void {
  let importedERC721 = NFTCollateral.load(event.params.collateralNft.toHexString());
  let fraktal = FraktalNft.load(importedERC721.fraktal);
  fraktal.status = 'retrieved'
  fraktal.save()
  importedERC721.fraktal = null;
  importedERC721.tokenId = null;
  importedERC721.save();
}
// event ERC1155UnLocked(address owner, address tokenAddress, address collateralNft, uint256 index);
export function handleERC1155UnLocked(event: ERC1155UnLocked): void {
  let importedERC1155 = NFTCollateral.load(event.params.collateralNft.toHexString());
  let fraktal = FraktalNft.load(importedERC1155.fraktal);
  fraktal.status = 'retrieved'
  fraktal.save()
  importedERC1155.fraktal = null;
  importedERC1155.tokenId = null;
  importedERC1155.save();
}

// event RevenuesProtocolUpgraded(address _newAddress);
// event FraktalProtocolUpgraded(address _newAddress);
