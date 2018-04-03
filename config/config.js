let state = {
	database: null,
	secret: null,
	bucketName: null,
	environment: null,
};

exports.init = function (port = 3000, done) {

	state.database = "mongodb://DSAdmin:driverproject2#@cluster0-shard-00-00-evmg6.mongodb.net:27017,cluster0-shard-00-01-evmg6.mongodb.net:27017,cluster0-shard-00-02-evmg6.mongodb.net:27017/version1?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin";
	state.secret = "driversprite";
	state.environment = "development";
	done();
};

exports.secret = function () {
	return state.secret
};

exports.database = function () {
	return state.database
};


exports.environment = function () {
	return state.environment
};

exports.bucketName = function () {
	return state.bucketName
};