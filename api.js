const express = require('express');
const router = express.Router();

router.get('/test', function(req,res){
	res.send("Test Hello world");
});

const paymentService = require('./services/paymentService');
router.post('/testPayment', paymentService.testPayment);

router.get('/testretrieve', paymentService.testRetrieve);

module.exports = router;