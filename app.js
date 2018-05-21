const express = require('express');
const fs = require('fs');
const efp = require("express-form-post");
var path = require('path');
var events = require('events');

const app = express();
var eventer = new events.EventEmitter();

const port = 4040;
const PUBLIC_FOLDER = "public";
const DATA_INDEX = "index.json";

const formPost = efp({
	store: "disk",
	directory: path.join(__dirname, "tmp"),
	maxfileSize: 10000000,
	filename: function(req, file, cb) {
		cb(file.originalname);
	}
});


app.use(express.static(PUBLIC_FOLDER));
app.use(formPost.middleware());

function buildingTxt(){
	var obj = JSON.parse(fs.readFileSync('./' + PUBLIC_FOLDER + '/' + DATA_INDEX, 'utf8'));
	obj = JSON.stringify(obj)
	console.log(obj);
	return obj;
}

app.get('/list', function(req, res){
	if (req.query.wait !== undefined){
		eventer.once('newBuilding', function(){
			res.end(buildingTxt());
		});
	} else{
		res.end(buildingTxt());
	}
});

app.get('/add', function(req, res) {
	var id = req.query.id;
	var shape = req.query.shape;
	var operation = req.query.operation;
	var dancing = req.query.dancing;

	var person = {
		id: id,
		shape: shape,
		operation : operation,
		dancing : dancing
	};	
	var totalCount = updateIndexFile(function(err){
		if (err){
			console.log(err);
		}
	});
	console.log(totalCount);

	saveDataToPublicFolder(totalCount.toString().padStart(4,"0") + ".json", person, function(err) {
		if (err) {
			res.status(404).send('User not saved');
			return;
		}

		res.send('User saved');
		eventer.emit('newBuilding');
		console.log(req.query);
	});
});


app.post("/upload", formPost.middleware(), function(req, res, next) {
	console.log("I just received files", req.files);
	res.send("Upload successful!");
});

function saveDataToPublicFolder(filename, data, callback) {
	fs.writeFile('./' + PUBLIC_FOLDER +'/' + filename, JSON.stringify(data), callback);
};

function updateIndexFile(callback) {
	// open file
	var obj = JSON.parse(fs.readFileSync('./' + PUBLIC_FOLDER + '/' + DATA_INDEX, 'utf8'));
	// get total count
	var totalCount = obj.totalCount;
	// update total count
	obj.totalCount = totalCount+1;
	console.log(JSON.stringify(obj));
	fs.writeFile('./' + PUBLIC_FOLDER + '/' + DATA_INDEX, JSON.stringify(obj), callback);
	// return count
	return obj.totalCount;
};

app.listen(port, function() {
	console.log('server up and running at port: %s', port);
});