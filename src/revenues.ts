import { BigInt, Address, log } from "@graphprotocol/graph-ts"
import {
  PayeeAdded,
  PaymentReleased,
  PaymentReceived,
} from "../generated/templates/PaymentSplitterUpgradeable/PaymentSplitterUpgradeable"
import {
  Revenue,
} from "../generated/schema"
// import { PaymentSplitterUpgradeable } from '../generated/templates/PaymentSplitterUpgradeable/PaymentSplitterUpgradeable';

import { getFraktionBalance } from './helpers';

// add list of holders and shares (taken from addPayee)
// add buyout (bool) to revenue attributes
// add fraktionsBalance -= amount when buyout

// event PayeeAdded(address account, uint256 shares);
// export function handlePayeeAdded(event: PayeeAdded): void {
  // account
  // shares
  // let revenue = Revenue.load(event.address.toHexString())
  // let payees = revenue.payees;
  // let user = getUser(event.params.account);
  // payees.push(user.id)
  // revenue.payees = payees;
  // revenue.save();
// }

// event PaymentReleased(address to, uint256 amount);
export function handlePaymentReleased(event: PaymentReleased): void {
  // to
  // amount
  // let contract = PaymentSplitterUpgradeable.bind(event.address)
  // let buyout = contract.try_buyout()
  // revenueChannel.buyout = buyout;
  let revenue = Revenue.load(event.address.toHexString())
  if(revenue.buyout){
    revenue.value -= event.params.amount;
  }
  let fraktionsBalance = getFraktionBalance(
    event.transaction.from.toHexString(),
    revenue.tokenAddress.toHexString()
  )
  fraktionsBalance.amount = BigInt.fromI32(0);
  fraktionsBalance.save()
  revenue.save()
}

// event PaymentReceived(address from, uint256 amount);
export function handlePaymentReceived(event: PaymentReceived): void {
  // from
  // amount
  let revenue = Revenue.load(event.address.toHexString())
  revenue.value += event.params.amount;
}
