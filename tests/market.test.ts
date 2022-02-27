import { newMockEvent, clearStore, test, assert } from "matchstick-as/assembly/index"
import { log } from "matchstick-as/assembly/log"
import { FraktalNft, ListItem } from "../generated/schema"
import { handleItemListed } from "../src/market"
import { ItemListed } from "../generated/FraktalMarket/FraktalMarket"
import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"

function createItemListedEvent(owner: string, token: string, price: BigInt, shares: BigInt): ItemListed {
  let newItemListedEvent = changetype<ItemListed>(newMockEvent())

  newItemListedEvent.parameters = new Array()
  newItemListedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(Address.fromString(owner)))
  )
  newItemListedEvent.parameters.push(
    new ethereum.EventParam("tokenAddress", ethereum.Value.fromAddress(Address.fromString(token)))
  )
  newItemListedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )
  newItemListedEvent.parameters.push(
    new ethereum.EventParam("amountOfShares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return newItemListedEvent
}

test("Can handle ItemListed event", () => {
  const listItem = new ListItem("listItemId0")
  listItem.save()

  assert.fieldEquals("ListItem", "listItemId0", "id", "listItemId0")

  // Wrap addresses with Address.fromString to normalize capitalization
  const owner = Address.fromString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A").toHexString()
  const token = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7").toHexString()
  const price = BigInt.fromU32(7000)
  const shares = BigInt.fromU32(100)
  const id = [owner, token].join("-")

  // Create FraktalNft entity to check status assignment
  const nft = new FraktalNft(token)
  nft.save()

  const newItemListedEvent = createItemListedEvent(owner, token, price, shares)
  handleItemListed(newItemListedEvent)

  assert.fieldEquals("ListItem", id, "fraktal", token)
  assert.fieldEquals("ListItem", id, "seller", owner)
  assert.fieldEquals("ListItem", id, "gains", BigInt.zero().toString())
  assert.fieldEquals("ListItem", id, "price", price.toString())
  assert.fieldEquals("ListItem", id, "shares", shares.toString())
  assert.fieldEquals("FraktalNft", token, "status", "open")
  clearStore()
})

test("Can handle delisting via ItemListed event", () => {
  // Wrap addresses with Address.fromString to normalize capitalization
  const owner = Address.fromString("0xA16081F360e3847006dB660bae1c6d1b2e17eC2A").toHexString()
  const token = Address.fromString("0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7").toHexString()
  const price = BigInt.fromU32(7000)
  const shares = BigInt.fromU32(100)
  const id = [owner, token].join("-")

  const item = new ListItem(id)
  item.seller = owner
  item.fraktal = token
  item.price = price
  item.shares = shares
  item.save()

  // Create FraktalNft entity to check status assignment
  const nft = new FraktalNft(token)
  nft.status = "open"
  nft.save()

  const delistItemListedEvent = createItemListedEvent(owner, token, BigInt.zero(), BigInt.zero())
  handleItemListed(delistItemListedEvent)

  assert.notInStore("ListItem", id)
  assert.fieldEquals("FraktalNft", token, "status", "closed")
  clearStore()
})