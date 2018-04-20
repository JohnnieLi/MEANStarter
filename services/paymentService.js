/* ******************************************************
// This service is designed for stripe payment processing
// https://stripe.com/docs/quickstart
// https://stripe.com/docs/api#subscriptions
// Author: Jiangqi Li
********************************************************* */
let User = require('../models/User');
let MemberShip = require('../models/MemberShip');
let BusinessManDetail = require('../models/BusinessManDetail')
let config = require('./config/config'); // get our config file
let stripe = require("stripe")(config.stripeKey());
let ObjectId = require('mongodb').ObjectID;

module.exports = {

	//total new
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
						customerId: customer.id,
						subscriptionId: subscription.id,
						period: plan.period,
						period_start: subscription.current_period_start,
						nextBillingDate: subscription.current_period_end,
						Plan_id: plan._id,
						user_id: user_id,
						status: subscription.status, //active, inactive
						specialPromo: false  // default = false, if is true, then belong to Free account without payment information
					});
					member.save(function(err) {
						if(err){
							res.json({success: false, message: err.message});
						}
						else{
							User.update({'_id': user_id}, {
								$set: {
									'role': 2,
									'memberShip_id': _id,
									'plan_id': plan._id,
								}
							}, function(err) {
								if(err){
									return res.json({success: false, message: err.message});
								}
								else{
									return res.json({success: true, result: plan._id});  // let FE user update grade and role
								}
							});
						}
					});// end of save memeberShip
				}// end of create subscription
			}// end of create customer
		} catch(e){
			return res.json({success: false, message: e.message});
		}
	},

	//canceled before, then continue(without trail)
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
					    'plan_id': plan._id,
					    'period': plan.period,
					    'period_start': subscription.current_period_start,
					    'nextBillingDate': subscription.current_period_end,
					    'subscriptionId': subscription.id,
					    'customerId': customer.id,
					    'status': subscription.status
				    };
				    const memberShipUpdated = await updateMemberShip(memberShip_id,values);

				    const userValues = {
					    'role': 2,
					    'plan_id':  plan._id,
				    };
				    const userUpdated = await updateUser(user_id,userValues);


				    const detailValues = {
					    'availableUntil': subscription.current_period_end,
				    };
				    const detailUpdated = await updateDetail(user_id, detailValues);


				    return res.json({success: true, result: plan._id});
			    }// end of create subscription
			    else{
				    return res.json({success: false, message:'subscription created failed'});
			    }
		    }else{
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
						'plan_id': plan.id,
						'nextBillingDate': updated.current_period_end,
						'status': updated.status
					};
					const memberShipUpdated = await updateMemberShip(memberShip_id,values);

					const userValues = {
						'role': 2,
						'plan_id': plan._id,
					};

					const userUpdated = await updateUser(user_id,userValues);


					const deatilValues = {
						'status': 0,
					};
					const detailUpdated = await updateDetail(user_id, deatilValues);


					return res.json({success: false, message: err.message});
				}
				else{
					return res.json({success: false, message: 'update subscription failed'});  // let FE user update grade and role
				}
			}else{
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
			let memberShip = await getMemberShip(memberShip_id, user_id);
			if(memberShip){
				let canceled = await CancelSunscription(memberShip.subscriptionId);
				if(canceled){
					const values = {
						'plan_id': null,
						'subscriptionId': null,
						'customerId': null,
						'status': 'inactive'
					};
					const memberShipUpdated = await updateMemberShip(memberShip_id,values);


					const userValues = {
						'role': 2,
						'plan_id': null,
					};

					const userUpdated = await updateUser(user_id, userValues);


					return res.json({success: false, message: err.message});
				}
			}else{

			}
		}catch(e){
			res.json({success: false, message: e.message});
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
let updateDetail = function(user_id, values){
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
		source: token,
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
		trial_period_days: 30, // 30 days trial
		tax_percent: 13,   //HST 13%
		coupon: coupon,
	});
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


