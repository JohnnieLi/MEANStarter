let User = require('../models/User');
let MemberShip = require('../models/MemberShip');
let jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
let config = require('../config'); // get our config file
let crypto = require('crypto');
let forgotPassEmailService = require('../services/forgotPassEmail');
let emailVerificationService = require("../services/emailVerification");
let ImageService = require('../services/imageService');
let ObjectId = require('mongodb').ObjectID;
let logService = require('../services/logService');

module.exports = {

	//simple register with password hash(no email-verification), never used in this project.
	simpleRegister: function (req, res) {
		let username = req.body.username;
		console.log("username :" + username);
		User.findOne({username: username}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			} else if (result) { // if user exist
				return res.json({success: false, message: "User already exist, please change userName"});
			} else {
				let salt = genRandomString(16);
				/** Gives us salt of length 16 */
				let passwordData = sha512(req.body.password, salt);

				console.log('UserPassword = ' + req.body.password);
				console.log('Passwordhash = ' + passwordData.passwordHash);
				console.log('\nSalt = ' + passwordData.salt);

				let user = new User({
					username: req.body.username,
					lastName: req.body.lastName,
					firstName: req.body.firstName,
					password: passwordData.passwordHash,
					salt: passwordData.salt
				});
				user.save(function (err) {
					if (err) {
						console.log(err.message);
						res.json({success: false, message: err.message});
					} else {
						console.log(user.userName + " saved");
						let showMessage = "user:" + req.body.username + " register successfully "
						res.json({success: true, message: showMessage});
					}
				})
			}
		});
	},

	register: emailVerificationService.registerWithSendEmail,

	confiremRegister: emailVerificationService.confiremEmail,


	adminLogAs: function(req,res){
		let admin = req.decodedUser;
		let _id = req.body._id;
		if(admin.username === "admin@atbi.ca") {
			User.findOne({_id: _id}, function (err, result) {
				if (result) {
					let user = new User();
					user.lastName = result.lastName;
					user.firstName = result.firstName;
					user.username = result.username;
					user.path = result.path;
					user.role = result.role;
					user._id = result._id;
					user.hasProfileImage = result.hasProfileImage;

					let token = jwt.sign(user, config.secret(), {
						expiresIn: 60 * 60// expires in seconds
					});
					// return the information including token as JSON
					res.json({
						success: true,
						result: token
					});
				}else{
					res.json({
						success: false,
					});
				}
			});
		}else{
			res.json({
				success: false,
			});
		}
	},


	validateToken: function (req, res) {
		if (req.decodedUser) {
			let role = req.decodedUser.role;
			return res.send({valid: true, role: role})
		} else {
			return res.send({valid: false})
		}

	},

	registerLogin: function (req, res) {
		let username = req.body.username;
		let password = req.body.password;
		console.log("input username :" + username);
		console.log("input password :" + password);
		User.findOne({username: username, authType: 'register'}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			}
			if (result) {
				//tempory designed for test with no salt user data, delete the no salt user when publish
				if (result.salt) {
					//hash password to compare the hashed one
					let userInputPasswordHashed = sha512(req.body.password, result.salt);
					// check if password matches
					if (result.password != userInputPasswordHashed.passwordHash) {
						return res.json({success: false, message: "Authentication failed. Wrong password."});
					} else {
						// if user is found and password is right
						// create a token
						let user = new User();
						user.lastName = result.lastName;
						user.firstName = result.firstName;
						user.username = result.username;
						user.path = result.path;
						user.role = result.role;
						user._id = result._id;
						user.hasProfileImage = result.hasProfileImage;

						let token = jwt.sign(user, config.secret(), {
							expiresIn: 60 * 60// expires in seconds
						});
						// return the information including token as JSON
						res.json({
							user: user,
							success: true,
							message: 'token sent',
							token: token
						});
					}
					// this else part will be deleted when finished test.
				} else {
					if (result.password != req.body.password) {
						return res.json({success: false, message: "Authentication failed. Wrong password."});
					} else {
						// if user is found and password is right
						// create a token


						let user = new User();
						user.lastName = result.lastName;
						user.firstName = result.firstName;
						user.username = result.username;
						user.path = result.path;
						user.role = result.role;
						user._id = result._id;
						user.hasProfileImage = result.hasProfileImage;

						let token = jwt.sign(user, config.secret(), {
							expiresIn: 60 * 60// expires in seconds
						});
						// return the information including token as JSON
						res.json({
							user: user,
							success: true,
							message: 'token sent',
							token: token
						});
					}
				}// end of else part deleted

			} else {
				return res.json({success: false, message: "Authentication failed. User not found."});
			}
		});
	},


	facebookLogin: function (req, res) {
		let socialUser = req.body.socialUser;
		//console.log(socialUser);
		User.findOne({authId: socialUser.id, authType: 'facebook'}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			}

			if (result) { // if user exist, return user login
				let returnUser = new User();
				returnUser.lastName = result.lastName;
				returnUser.firstName = result.firstName;
				returnUser.username = result.username;
				returnUser.path = result.path;
				returnUser.role = result.role;
				returnUser._id = result._id;
				returnUser.hasProfileImage = result.hasProfileImage;
				returnUser.authType = result.authType;
				returnUser.imageUrl = result.imageUrl;

				let token = jwt.sign(returnUser, config.secret(), {
					expiresIn: 60 * 60// expires in seconds
				});
				// return the information including token as JSON
				return res.json({
					user: returnUser,
					success: true,
					message: 'token sent',
					token: token
				});
			} else {
				let _id = new ObjectId();
				let userPath = "/users/" + _id + "/";
				let user = new User({
					_id: _id,
					username: socialUser.email,
					lastName: socialUser.lastName,
					firstName: socialUser.firstName,
					authId: socialUser.id,
					authType: 'facebook',
					role: 0,
					status: 1,
					email: socialUser.email,
					imageUrl: socialUser.photoUrl,
					path: userPath,
					grade: 0

				});
				user.save(function (err) {
					if (err) {
						console.log(err.message);
						return res.json({success: false, message: err.message});
					} else {
						let message = "new user " + user.username + "registered.";
						logService.logger('info', message);
						let returnUser = new User();
						returnUser.lastName = user.lastName;
						returnUser.firstName = user.firstName;
						returnUser.username = user.username;
						returnUser.path = user.path;
						returnUser.role = user.role;
						returnUser._id = user._id;
						returnUser.hasProfileImage = user.hasProfileImage;
						returnUser.authType = user.authType;
						returnUser.imageUrl = user.imageUrl;

						let token = jwt.sign(returnUser, config.secret(), {
							expiresIn: 60 * 60// expires in seconds
						});
						// return the information including token as JSON
						return res.json({
							user: user,
							success: true,
							message: 'token sent',
							token: token
						});
					}
				})
			}
		});
	},

	googleLogin: function (req, res) {
		let socialUser = req.body.socialUser;
		//console.log("username :" + username);
		User.findOne({authId: socialUser.id, authType: 'google'}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			} else if (result) { // if user exist, return user login
				let returnUser = new User();
				returnUser.lastName = result.lastName;
				returnUser.firstName = result.firstName;
				returnUser.username = result.username;
				returnUser.path = result.path;
				returnUser.role = result.role;
				returnUser._id = result._id;
				returnUser.hasProfileImage = result.hasProfileImage;
				returnUser.authType = result.authType;
				returnUser.imageUrl = result.imageUrl;

				let token = jwt.sign(returnUser, config.secret(), {
					expiresIn: 60 * 60// expires in seconds
				});
				// return the information including token as JSON
				return res.json({
					user: returnUser,
					success: true,
					message: 'token sent',
					token: token
				});
			} else {
				let _id = new ObjectId();
				let userPath = "/users/" + _id + "/";
				let name = socialUser.name;
				let firstName = name.split(" ")[0];
				let lastName = name.split(" ")[1];
				let user = new User({
					_id: _id,
					username: socialUser.email,
					lastName: lastName,
					firstName: firstName,
					authId: socialUser.id,
					authType: 'google',
					role: 0,
					status: 1,
					email: socialUser.email,
					imageUrl: socialUser.photoUrl,
					path: userPath,
					grade: 0

				});
				user.save(function (err) {
					if (err) {
						console.log(err.message);
						return res.json({success: false, message: err.message});
					} else {
						let message = "new user " + user.username + "registered.";
						logService.logger('info', message);
						let returnUser = new User();
						returnUser.lastName = user.lastName;
						returnUser.firstName = user.firstName;
						returnUser.username = user.username;
						returnUser.path = user.path;
						returnUser.role = user.role;
						returnUser._id = user._id;
						returnUser.hasProfileImage = user.hasProfileImage;
						returnUser.authType = user.authType;
						returnUser.imageUrl = user.imageUrl;

						let token = jwt.sign(returnUser, config.secret(), {
							expiresIn: 60 * 60// expires in seconds
						});
						// return the information including token as JSON
						return res.json({
							user: user,
							success: true,
							message: 'token sent',
							token: token
						});
					}
				})
			}
		});
	},

	updatePass: function (req, res) {
		let username = req.decodedUser.username;
		let password = req.body.oldPass;
		let newPassword = req.body.newPass;
		//console.log(username + ' ' + password + ' ' + newPassword);
		User.findOne({username: username}, function (err, user) {
			if (err) {
				throw err;
			}

			if (!user) {
				return res.json({success: false, message: "Authentication failed. User not found."});
			} else {
				if (user.salt) {
					let userInputPasswordHashed = sha512(password, user.salt);
					if (user.password != userInputPasswordHashed.passwordHash) {
						return res.json({success: false, message: "Authentication failed. Wrong old password."});
					}
					let newSalt = genRandomString(16);
					let userNewPasswordHashed = sha512(newPassword, newSalt);
					User.update({'username': username}, {
						$set: {
							'password': userNewPasswordHashed.passwordHash,
							'salt': userNewPasswordHashed.salt
						}
					}, function (err, result) {
						if (err) {
							return res.json({success: false, message: "Password update failed,please tyr it later."});
						}
						if (result) {
							return res.json({success: true, message: "User password has changed successfully"});
						}
					});
				} else {
					if (user.password != password) {
						return res.json({success: false, message: "Authentication failed. Wrong old password."});
					}
					let newSalt = genRandomString(16);
					let userNewPasswordHashed = sha512(newPassword, newSalt);
					User.update({'username': username}, {
						$set: {
							'password': userNewPasswordHashed.passwordHash,
							'salt': userNewPasswordHashed.salt
						}
					}, function (err, result) {
						if (err) {
							return res.json({success: false, message: "Password update failed,please tyr it later."});
						}
						if (result) {
							return res.json({success: true, message: "User password has changed successfully"});
						}
					});
				}

			}

		});
	},


	updateProfile: function (req, res) {
		let username = req.decodedUser.username;
		let firstName = req.body.firstName;
		let lastName = req.body.lastName;
		User.update({'username': username}, {
			$set: {
				'lastName': lastName,
				'firstName': firstName
			}
		}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			}

			if (result) {
				return res.json({success: true, message: "User profile has changed successfully"});
			} else {
				return res.json({success: false, message: "no user"});
			}
		});
	},

	uploadProfilePic: function (req, res) {
		console.log('here');
		let token = req.header('Authorization') || req.query.token;
		jwt.verify(token, config.secret(), function (err, decoded) {
			let username;
			if (err) {
				return res.json({path: null, success: false, message: "cannot found upload."});
			} else {
				username = decoded._doc.username;
				const user_id = decoded._doc._id;
				let path = 'userImages/' + user_id + '/profile/';
				console.log(req);

				ImageService.uploadImage(path, req.file)
					.then(result => {
						User.update({'username': username}, {
							$set: {
								'hasProfileImage': true,
								'imageUrl': result
							}
						}, function (err, user) {
							if (!err) {
								return res.json({path: result, success: true, message: user});
							}
						});
					})
					.catch(error => {
						return res.json({path: null, success: false, message: "cannot found upload."})
					});
			}
		});
	},

	removeUserImage: function (req, res) {
		let username = req.decodedUser.username;
		User.update({'username': username}, {
			$set: {
				'hasProfileImage': false
			}
		}, function (err, result) {
			if (err) {
				return res.json({success: false, message: err.message});
			}

			if (result) {
				return res.json({success: true, message: "User picture has removed successfully"});
			} else {
				return res.json({success: false, message: "no user"});
			}
		});
	},

	forgotPass: forgotPassEmailService.forgotPass,

	resetPass: forgotPassEmailService.resetPass,


	addMemberShip: function(req, res) {
		let user_id = req.decodedUser._id;
		let user = new User({
			username: req.body.username,
			lastName: req.body.lastName,
			firstName: req.body.firstName,
			password: passwordData.passwordHash,
			salt: passwordData.salt
		});
	}


};
//end of module.exports


/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
let genRandomString = function (length) {
	return crypto.randomBytes(Math.ceil(length / 2))
		.toString('hex') /** convert to hexadecimal format */
		.slice(0, length);
	/** return required number of characters */
};

/**
 * hash password with sha512. check more detail for algorithm: https://en.wikipedia.org/wiki/Secure_Hash_Algorithm
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
let sha512 = function (password, salt) {
	let algorithm = 'sha512';
	let hash = crypto.createHmac(algorithm, salt);
	/** Hashing algorithm sha512 */
	hash.update(password);
	let value = hash.digest('hex');
	return {
		salt: salt,
		passwordHash: value
	};
};

//never used in real code, created for check
function saltHashPassword(userpassword) {
	let salt = genRandomString(16);
	/** Gives us salt of length 16 */
	let passwordData = sha512(userpassword, salt);
	console.log('\nSalt = ' + passwordData.salt);
}