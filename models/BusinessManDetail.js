// get an instance of mongoose and mongoose.Schema
let mongoose = require('mongoose');
//var ObjectId = require('mongodb').ObjectID;
let Schema = mongoose.Schema;

let detailSchema = Schema({
	id: Number,
	name: String,
	category: String,
	title: String,
	language: String,
	address: String,
	phone: Number,
	email: String,
	introduction: String,
	tools: [{type:String, link:String}],
	serviceIntroduction: String,
	featureHidden:Boolean,
	features: [{imagePath:String, content: String, title:String}],
	portfolioHidden: Boolean,
	portfolios: [{imagePath:String, content:String, title:String, postTime:String}],
	pricingHidden: Boolean,
	pricings: [{price: String, title:String, content:String}],
	// videoHidden:Boolean,
	// videos: [{url:String}],
	user_id: {type: Schema.Types.ObjectId, ref:'User'},
	status: Number,
	view: Number,
	area: String,
	score: Number

});

module.exports = mongoose.model("BusinessManDetail", detailSchema);