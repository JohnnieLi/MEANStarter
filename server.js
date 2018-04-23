// =======================
// get the packages we need ============
// =======================
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let path = require('path');
let mongoose = require('mongoose');

let compression = require('compression')
let config = require('./config/config'); // get our config file
let cors = require('./config/cors');//get Cross-Origin Resource Sharing (CORS) config

const api = require('./api');


app.use(cors);// set CORS
// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'ATBI/dist')));


//API Router
app.use('/api', api);

// Send all other requests to the Angular app
// app.get('*', (req, res) => {
// 	res.sendFile(path.join(__dirname, 'dist/index.html'));
// });

const port = 3000;

// let server = app.listen(port, function() {
// 	console.log('listening on port', server.address().port);
// });

config.init(port, function(){
	mongoose.connect(config.database(), function (err) {
		if (!err) {
			console.log("we are connected to mongo in ", config.environment());
			let server =  app.listen(port, function () {
				console.log('listening on port', server.address().port);
			});
		} else {
			console.log(err);
		}
	}); // connect to database
});