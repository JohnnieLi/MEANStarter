/* ******************************************************
// This service is designed for stripe payment processing
// https://stripe.com/docs/quickstart
// https://stripe.com/docs/api#subscriptions
// Author: Jiangqi Li
********************************************************* */
let User = require('../models/User');
let MemberShip = require('../models/MemberShip');
let License = require('../models/License');
let BusinessManDetail = require('../models/BusinessManDetail')
let config = require('../config/config'); // get our config file
let stripe = require("stripe")("sk_test_J74t4fV8vATAU286OYWdeVyK");
let ObjectId = require('mongodb').ObjectID;

module.exports = {

	createLicense: async function(req, res) {
		let user_id = req.decodedUser._id;
		let token = req.body.token;
		let plan = req.body.plan;
		let discount = req.body.discount;
		try{
			let customer = await createStripeCustomer(token, user_id);
			if(customer){
				let subscription = await createSubscription(customer, plan.id, discount);
				if(subscription){
					let _id = new ObjectId();
					let license = new License({
						_id: _id,
						customerId: customer.id,
						subscriptionId: subscription.id,
						period: plan.period,
						period_start: subscription.current_period_start,
						nextBillingDate: subscription.current_period_end,
						PlanId: plan.id,
						user_id: user_id,
						status: subscription.status, //active, inactive
					});
					license.save(function(err) {
						if(err){
							return res.json({success: false, message: err.message});
						}
						else{
							return res.json({success: true, result: _id});
						}
					});// end of save memeberShip
				}// end of create subscription
				return res.json({success: false, message: 'subscription created failed'})
			}// end of create customer
			return res.json({success: false, message: 'customer created failed'})
		} catch(e){
			return res.json({success: false, message: e.message});
		}
	},


	activeLicense: async function(req, res) {
		let user_id = req.decodedUser._id;
		let memberShip_id = req.decodedUser.memberShip_id;
		let license = req.body.license;
		if(memberShip_id){ // if has membership before
			let memberShipValues = {
				'type': 1,
				'license_id': license._id,
				'period': license.period,
				'status': license.status,
				'period_start': license.period_start,
				'nextBillingDate': license.nextBillingDate,
				'PlanId': license.PlanId
			};
			MemberShip.update({'_id': memberShip_id, 'user_id': user_id}, {
				$set: memberShipValues
			}, function(err, result) {
				if(err){
					return res.json({success: false, message: err.message});
				}
				else{
					return res.json({success: true, result: result});
				}
			});
		}
		else{ // if totally new , create a new membership
			let _id = new ObjectId();
			let member = new MemberShip({
				_id: _id,
				type: 1,
				license_id: license._id,
				customerId: null,
				subscriptionId: null,
				period: license.period,
				period_start: license.period_start,
				nextBillingDate: license.nextBillingDate,
				PlanId: license.PlanId,
				user_id: user_id,
				status: license.status,
				specialPromo: false  // default = false, if is true, then belong to Free account without payment information
			});
			member.save(function(err) {
				if(err){
					return res.json({success: false, message: err.message});
				}
				else{
					const userValues = {
						'role': 2,
						'memberShip_id': _id,
					};
					User.update({'_id': user_id}, {
						$set: userValues
					}, function(err, result) {
						if(err){
							return res.json({success: false, message: err.message});
						}
						else{
							//create business man detail page
							let detail = new BusinessManDetail({
								user_id: user_id,
								memberShip_id: _id,
							});
							detail.save(function(err) {
								if(err){
									return res.json({success: false, message: err.message});
								}
								else{
									return res.json({success: true});
								}
							});
						}
					});
				}
			});// end of save memeberShip
		}
	},


	inactiveLicense: async function(req, res) {
		let user_id = req.decodedUser._id;
		let memberShip_id = req.decodedUser.memberShip_id;
		let license = req.body.license;
		let memberShipValues = {
			'type': 0,
			'license_id': null,
			'period': null,
			'status': 'cancelled',
			'period_start': null,
			'nextBillingDate': Date() + 1,
			'PlanId': null
		};
		MemberShip.update({'_id': memberShip_id, 'user_id': user_id}, {
			$set: memberShipValues
		}, function(err, result) {
			if(err){
				return res.json({success: false, message: err.message});
			}
			else{
				return res.json({success: true, result: result});
			}
		});
	},


	getLicense: function(req, res) {
		let license = req.body.license;
		License.findOne({_id: license._id}, function(err, result) {
			if(err){
				return res.json({success: false, message: err.message});
			}
			if(result){
				MemberShip.findOne({type: 1, license_id: result._id}, function(err, usedBy) {
					if(err){
						return res.json({success: false, result: result, usedBy: null});
					}
					return res.json({success: true, result: result, usedBy: usedBy});
				});
			}
		});
	},


	cancelLicense: async function(req, res) {
		let user_id = req.decodedUser._id;
		let license_id = req.decodedUser.license._id;
		try{
			let license = await getLicense(license_id, user_id);
			if(license){
				let canceled = await CancelSunscription(license.subscriptionId);
				if(canceled){
					const values = {
						'plan_id': null,
						'subscriptionId': null,
						'customerId': null,
						'status': 'canceled'
					};
					const licenseUpdated = await updateLicense(license_id, values);

					const memberShip = await getMemberShipByLicense(licenseUpdated.id);

					if(memberShip){
						const MemberValues = {
							'status': 'canceled'
						};
						const memberShipUpdated = await updateMemberShip(memberShip._id, MemberValues)
					}
					return res.json({success: true, message: "cancelled"});
				}
			}
			return res.json({success: false, message: "cancelled failed"});
		} catch(e){
			res.json({success: false, message: e.message});
		}
	},


	updateLicenseStatus: function(req, res) {

	},


	//total new by self-payment
	addMemberShip: async function(req, res) {
		let user_id = req.decodedUser._id;
		let token = req.body.token;
		let plan = req.body.plan;
		let discount = req.body.discount;
		try{
			let customer = await createStripeCustomer(token, user_id);
			if(customer){
				let subscription = await createSubscription(customer, plan.id, discount);
				if(subscription){
					let _id = new ObjectId();
					let member = new MemberShip({
						_id: _id,
						type: 0,
						customerId: customer.id,
						subscriptionId: subscription.id,
						period: plan.period,
						period_start: subscription.current_period_start,
						nextBillingDate: subscription.current_period_end,
						PlanId: plan.id,
						user_id: user_id,
						status: subscription.status, //active, inactive
						specialPromo: false  // default = false, if is true, then belong to Free account without payment information
					});
					member.save(function(err) {
						if(err){
							return res.json({success: false, message: err.message});
						}
						else{
							const userValues = {
								'role': 2,
								'memberShip_id': _id,
							};
							User.update({'_id': user_id}, {
								$set: userValues
							}, function(err, result) {
								if(err){
									return res.json({success: false, message: err.message});
								}
								else{
									//create business man detail page
									let detail = new BusinessManDetail({
										user_id: user_id,
										memberShip_id: _id,
									});
									detail.save(function(err) {
										if(err){
											return res.json({success: false, message: err.message});
										}
										else{
											return res.json({success: true});
										}
									});
								}
							});
						}
					});// end of save memeberShip
				}// end of create subscription
				return res.json({success: false, message: 'subscription created failed'})
			}// end of create customer
			return res.json({success: false, message: 'customer created failed'})
		} catch(e){
			return res.json({success: false, message: e.message});
		}
	},

	//canceled before, then continue(without trail) by self-payment
	continueMemberShip: async function(req, res) {
		let user_id = req.decodedUser._id;
		let token = req.body.token;
		let plan = req.body.plan;
		let memberShip_id = req.decodedUser.memberShip_id;
		let discount = req.body.discount;
		try{
			let customer = await createStripeCustomer(token, user_id);
			if(customer){
				let subscription = await createSubscription(customer, plan.id, discount);
				if(subscription){
					const values = {
						'planId': plan.id,
						'period': plan.period,
						'period_start': subscription.current_period_start,
						'nextBillingDate': subscription.current_period_end,
						'subscriptionId': subscription.id,
						'customerId': customer.id,
						'status': subscription.status
					};
					const memberShipUpdated = await updateMemberShip(memberShip_id, values);


					return res.json({success: true, result: plan._id});
				}// end of create subscription
				else{
					return res.json({success: false, message: 'subscription created failed'});
				}
			}
			else{
				return res.json({success: false, message: 'customer created failed'});
			}// end of create customer
		} catch(e){
			return res.json({success: false, message: e.message});
		}
	},


	updatePlan: async function(req, res) {
		let user_id = req.decodedUser._id;
		let memberShip_id = req.decodedUser.memberShip_id;
		let plan = req.body.plan;
		try{
			let memberShip = await getMemberShip(memberShip_id, user_id);
			if(memberShip){
				let updated = await updateSubscription(memberShip.customerId, memberShip.subscriptionId, plan.id);
				if(updated){
					const values = {
						'planId': plan.id,
						'nextBillingDate': updated.current_period_end,
						'status': updated.status
					};
					const memberShipUpdated = await updateMemberShip(memberShip_id, values);

					if(memberShipUpdated){
						return res.json({success: true});
					}
					return res.json({success: false});
				}
				else{
					return res.json({success: false, message: 'update subscription failed'});  // let FE user update grade and role
				}
			}
			else{
				return res.json({success: false, message: 'can not find membership'});
			}
		} catch(e){
			res.json({success: false, message: e.message})
		}
	},


	cancelPlan: async function(req, res) {
		let user_id = req.decodedUser._id;
		let memberShip_id = req.decodedUser.memberShip_id;
		try{
			let memberShip = await getLicense(memberShip_id, user_id);
			if(memberShip){
				let canceled = await CancelSunscription(memberShip.subscriptionId);
				if(canceled){
					const values = {
						'plan_id': null,
						'subscriptionId': null,
						'customerId': null,
						'status': 'canceled'
					};
					const memberShipUpdated = await updateMemberShip(memberShip_id, values);

					return res.json({success: true, message: "cancelled"});
				}
			}
			return res.json({success: false, message: "cancelled failed"});
		} catch(e){
			res.json({success: false, message: e.message});
		}
	},


	testPayment: function(req, res) {
		let user_id = 'test user';
		let token = req.body.token;
		let planSelect = req.body.plan;
		let discount = req.body.discount;
		let plan = [];
		plan['daily'] = 'plan_CivfTggQTGXhy1';
		plan['3daily'] = 'plan_Civf43nPPhXxxo';
		plan['weekly'] = 'plan_CivgB7U3S3g5w0';
		plan['weekly2'] = 'plan_CjD3il3pd52TE9';
		let customer;
		//console.log(token,planSelect,discount);
		try{
			createStripeCustomer(token, user_id).then(
				result => {
					customer = result;
					console.log("customer created");
					return createSubscription(customer, plan[planSelect], discount);
				}
			).then(subscription => {
				console.log("subscribed");
				return res.json({success: true, subscription: subscription, customer: customer});
			});
		} catch(e){
			return res.json({success: false, message: e.message});
		}
	}
};//end of module


/**
 * get membership object by memberShip_id and user_id
 * @function  called
 * @param {String} memberShip_id - memberShip mongodb _id
 * @param {String} user_id - user mongodb _id
 */
let getMemberShip = function(memberShip_id, user_id) {
	return new Promise(function(resolve, reject) {
		MemberShip.findOne({_id: memberShip_id, user_id: user_id}, function(err, result) {
			if(err){
				reject(err);
			}
			else{
				if(result){
					const memberShip = {
						_id: result._id,
						customerId: result.customerId,
						subscriptionId: result.subscriptionId,
					};
					resolve(memberShip);
				}
				else{
					resolve(null);
				}
			}
		});
	});
};


/**
 * get membership object by memberShip_id and user_id
 * @function  called
 * @param {String} license_id - memberShip mongodb _id
 * @param {String} user_id - user mongodb _id
 */
let getLicense = function(license_id, user_id) {
	return new Promise(function(resolve, reject) {
		License.findOne({_id: license_id, user_id: user_id}, function(err, result) {
			if(err){
				reject(err);
			}
			else{
				if(result){
					const license = {
						_id: result._id,
						customerId: result.customerId,
						subscriptionId: result.subscriptionId,
					};
					resolve(license);
				}
				else{
					resolve(null);
				}
			}
		});
	});
};


let getMemberShipByLicense = function(license_id) {
	return new Promise(function(resolve, reject) {
		MemberShip.findOne({type: 1, license_id: license_id}, function(err, result) {
			if(err){
				reject(err);
			}
			else{
				if(result){
					const memberShip = {
						_id: result._id,
						customerId: result.customerId,
						subscriptionId: result.subscriptionId,
					};
					resolve(memberShip);
				}
				else{
					resolve(null);
				}
			}
		});
	});
};
/**
 * update Membership
 * @function  called
 * @param {String} memberShip_id - memberShip mongodb _id
 * @param {Object} values - set object
 */
let updateMemberShip = function(memberShip_id, values) {
	return new Promise(function(resolve, reject) {
		MemberShip.update({'_id': memberShip_id}, {
			$set: values
		}, function(err, result) {
			if(err){
				reject();
			}
			else{
				resolve(result);
			}
		});
	});

};


/**
 * update Membership
 * @function  called
 * @param {String} license_id - License mongodb _id
 * @param {Object} values - set object
 */
let updateLicense = function(license_id, values) {
	return new Promise(function(resolve, reject) {
		License.update({'_id': license_id}, {
			$set: values
		}, function(err, result) {
			if(err){
				reject();
			}
			else{
				resolve(result);
			}
		});
	});
};

/**
 * update User table
 * @function  called
 * @param {String} user_id - memberShip mongodb _id
 * @param {Object} values - set object
 */
let updateUser = function(user_id, values) {
	return new Promise(function(resolve, reject) {
		User.update({'_id': user_id}, {
			$set: values
		}, function(err, result) {
			if(err){
				reject();
			}
			else{
				resolve(result);
			}
		});
	});

};

/**
 * update BusinessManDetail table
 * @function  called
 * @param {String} user_id - memberShip mongodb _id
 * @param {Object} values - set object
 */
let updateDetail = function(user_id, values) {
	return new Promise(function(resolve, reject) {
		BusinessManDetail.update({'user_id': user_id}, {
			$set: values
		}, function(err, result) {
			if(err){
				reject();
			}
			else{
				resolve(result);
			}
		});
	});
};


/**
 * generates stripe customer based on stripe checkout token
 * @function asynchronously called
 * @param {String} token - checkout token
 * @param {String} user_id - user mongodb _id
 */
let createStripeCustomer = function(token, user_id) {
	return stripe.customers.create({
		description: user_id,
		email: token.email,
		source: token.id,
	});
};

/**
 * generates stripe subscription
 * @function asynchronously called
 * @param {Object} customer - stripe customer object
 * @param {String} planId - stripe plan id
 * @param {number} discount
 */
let createSubscription = function(customer, planId, discount) {
	// console.log('createSubscription', customer);
	let coupon = null;
	switch(discount){
		case 0.9:
			coupon = "10%OFF";
			break;
		default:
			coupon = null;
			break;
	}
	if(coupon){
		return stripe.subscriptions.create({
			customer: customer.id,
			items: [{plan: planId}],
			// trial_period_days: 30, // 30 days trial
			tax_percent: 13,   //HST 13%
			coupon: coupon,
		});
	}
	else{
		return stripe.subscriptions.create({
			customer: customer.id,
			items: [{plan: planId}],
			// trial_period_days: 30, // 30 days trial
			tax_percent: 13,   //HST 13%
		});
	}

};

/**
 * generates stripe subscription without trial
 * @function asynchronously called
 * @param {Object} customer - stripe customer object
 * @param {String} planId - stripe plan id
 * @param {number} discount
 */
let createSubscriptionWithoutTrial = function(customer, planId, discount) {

	let coupon = "Origin";
	switch(discount){
		case 0.9:
			coupon = "10%OFF";
			break;
		default:
			coupon = "Origin";
			break;
	}

	return stripe.subscriptions.create({
		customer: customer.id,
		items: [{plan: planId}],
		tax_percent: 13,   //HST 13%
		coupon: coupon,
	});
};


/**
 * update stripe subscription
 * @function asynchronously called
 * @param {String} customerId - stripe customer id
 * @param {String} subscriptionId - subscription id
 * @param {String} planId
 */
let updateSubscription = async function(customerId, subscriptionId, planId) {

	let stripe = require("stripe")(subscriptionId);

	const subscription = await stripe.subscriptions.retrieve(subscriptionId);

	const update = await stripe.subscriptions.update(subscriptionId, {
		items: [{
			cancel_at_period_end: false,
			id: subscription.items.data[0].id,
			plan: planId,
		}]
	});
	//charge the padding invoice: pro
	stripe.invoices.create({
		customer: customerId,
	});

	return stripe.subscriptions.retrieve(subscriptionId);
	;
};

/**
 * cancel stripe subscription
 * @function asynchronously called
 * @param {String} subscriptionId - subscription id
 */
let CancelSunscription = function(subscriptionId) {
	stripe.subscriptions.del(subscriptionId, {at_period_end: true});
};


