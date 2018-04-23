// get an instance of mongoose and mongoose.Schema
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

/**
 * Using stripe (billing) as payment middleware
 * https://stripe.com/docs/api
 */
let memberShipSchema = Schema({
	type: Number,  //0: self pay  1: license
	license_id: {type: Schema.Types.ObjectId, ref:'License'},
	customerId: String,
	subscriptionId: String,
	period: String, //Monthly, Yearly
	period_start: Date,
	nextBillingDate: Date,
	PlanId: String,
	user_id: {type: Schema.Types.ObjectId, ref:'User'},
	status: String, //active, inactive
	specialPromo : Boolean  // default = false, if is true, then belong to Free account without payment information
});

module.exports = mongoose.model("MemberShip", memberShipSchema);