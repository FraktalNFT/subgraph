import { BigInt } from "@graphprotocol/graph-ts"
import {
  // PayeeAdded,
  PaymentReleased,
  PaymentReceived,
} from "../generated/templates/PaymentSplitterUpgradeable/PaymentSplitterUpgradeable"
import {
  Revenue,
} from "../generated/schema"
// import { PaymentSplitterUpgradeable } from '../generated/templates/PaymentSplitterUpgradeable/PaymentSplitterUpgradeable';

import { getFraktionBalance } from './helpers';

// event PaymentReleased(address to, uint256 amount);
export function handlePaymentReleased(event: PaymentReleased): void {
  let revenue = Revenue.load(event.address.toHexString())
  if(revenue.buyout){
    revenue.value.minus(event.params.amount);
    let fraktionsBalance = getFraktionBalance(
      event.transaction.from.toHexString(),
      revenue.tokenAddress.toHexString()
    )
    fraktionsBalance.amount = BigInt.fromI32(0);
    fraktionsBalance.save()
  }
  revenue.save()
}

// event PaymentReceived(address from, uint256 amount);
export function handlePaymentReceived(event: PaymentReceived): void {
  let revenue = Revenue.load(event.address.toHexString())
  revenue.value.plus(event.params.amount);
}
