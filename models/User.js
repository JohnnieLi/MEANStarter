// get an instance of mongoose and mongoose.Schema
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = Schema({
	username: String, // username == email
	password: String,
	lastName: String,
	firstName: String,
	email: String,
	role: Number, // 0 : normal user, 1 : business man user
	path: String,
	status: Number, // 0 : inactive, 1 : active
	phone: String,
	salt: String, // used for hash password
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	imageUrl: String, // user profile photo url
	authId: String,
	authToken: String,
	authType: String, // "register": normal register, "facebook": facebook Auth, "google": Google Auth
	memberShip_id: {type: Schema.Types.ObjectId, ref:'MemberShip'},
	plan_id: {type: Schema.Types.ObjectId, ref:'Plan'},
});

module.exports = mongoose.model("User", userSchema);