const shell = require('shelljs');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
var colors = require('colors');

exports.isExistingPath = isExistingPath;
exports.execScript = execScript;
exports.pollServerAvailability = pollServerAvailability;
exports.convertPathToAbsolutePath = convertPathToAbsolutePath;
exports.pathExists = pathExists;
exports.copyFile = copyFile;

function execScript(cmd, opt = {}) {
	opt.silent = opt.hasOwnProperty('silent') ? opt.silent : !global.verbose;

	if(opt.message) {
		console.log(opt.message);
	}

	var res = shell.exec(cmd, opt);

	if(res.code !== 0) {
		console.log(`exec failed for '${cmd}'`);
		throw new Error(res.stderr || res.stdout);
	}

	return res;
}

function isExistingPath(path) {
	return new Promise((resolve, reject) => {
		fs.stat(path, (err, stat) => {
			resolve(!err);
		});
	});
}

function pollServerAvailability(url) {
	var timeout = 1000 * 60 * 5; //5 min;
	var http = url.startsWith('https') ? require('https') : require('http');

	return new Promise((resolve, reject) => {
		var timeoutId = setTimeout(() => {
			reject(new Error(`${url} did not respond after ${timeout} millis`));
		}, timeout);

		var intervalId = setInterval(() => {
			var req = http.get(url, (res) => {

				if(res.statusCode === 200) {
					clearInterval(intervalId);
					clearTimeout(timeoutId);
					return resolve();
				}

				req.end();
			}).on("error", (err) => {
			});
		}, 2000);
	});
}

function convertPathToAbsolutePath(relPath) {
	if(relPath.startsWith('/')) {
		return relPath;
	}

	return path.join(process.cwd(), relPath);
}

function pathExists(filePath) {
	return new Promise(function (resolve, reject) {
		fs.stat(filePath, function (err) {
			resolve(!err);
		})
	})
}

function copyFile(src, dest, templateData) {
	if(!templateData || Object.keys(templateData).length === 0) {
		var stream = fs.createReadStream(src).pipe(fs.createWriteStream(dest));

		return new Promise((resolve, reject) => {
			stream.on('finish', resolve);
			stream.on('error', reject);
		});
	}

	return new Promise((resolve, reject) => {
		fs.readFile(src, (err, file) => {
			if(err) {
				return reject(err);
			}
			file = file.toString('utf8');
			file = handlebars.compile(file)(templateData);

			fs.writeFile(dest, file, (err) => {
				if(err) {
					return reject(err);
				}

				return resolve();
			});
		});
	});

}