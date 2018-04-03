// =======================
// get the packages we need ============
// =======================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

var compression = require('compression')
var config = require('./config/config'); // get our config file
var cors = require('./config/cors');//get Cross-Origin Resource Sharing (CORS) config

const api = require('./api');

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

var server = app.listen(port, function() {
	console.log('listening on port', server.address().port);
})