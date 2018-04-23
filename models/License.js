// get an instance of mongoose and mongoose.Schema
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

/**
 * Using stripe (billing) as payment middleware
 * https://stripe.com/docs/api
 */
let licenseSchema = Schema({
	customerId: String,
	subscriptionId: String,
	period: String, //Monthly, Yearly
	period_start: Date,
	nextBillingDate: Date,
	PlanId: String,
	user_id: {type: Schema.Types.ObjectId, ref:'User'},
	status: String, //active, cancelled, post-due etc
});

module.exports = mongoose.model("License", licenseSchema);