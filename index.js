#!/usr/bin/env node
global.verbose = process.argv.indexOf('--verbose') > -1;

const path = require('path');
const fs = require('fs');
const logger = require('./lib/logger');

module.exports = function (commandDir) {
	if(process.argv[2] === '--version' || process.argv[2] === '-v') {
		var parentPath = path.dirname(require.main.filename);
		parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));

		var packageJSON = require(path.join(parentPath, 'package.json'));
		console.log(packageJSON.version);
		process.exit();
	}

	var args = process.argv.slice(2);
	var commands = [];

	var i = 0;

	while (args[i] && args[i].charAt(0) !== '-') {
		commands.push(args[i++]);
	}

	if (commands.length === 0) {
		logger.error('missing command argument');
		process.exit(1);
	}

	getExistingCommands(commandDir).then(existingCommands => {
		commands = commands.map(c => c.replace(/-/g, '_'));
		var command = commands.join('-');
		var commandExists = false;
		var restArgs = [];

		for (var i = 0; i < existingCommands.length; i++) {
			var existingCommand = existingCommands[i];
			if (command.indexOf(existingCommand) === 0) {
				restArgs = command.substring(existingCommand.length + 1).split('-').map(arg => arg.replace(/\_/g, '-'));

				command = existingCommand;
				commandExists = true;
				break;
			}
		}

		if (!commandExists) {
			throw new Error(`command '${getRawCommandStr(command)}' does not exist`);
		}

		var scriptPath = path.join(commandDir, command);
		var scriptImpl = require(scriptPath);
		scriptImpl = scriptImpl.default || scriptImpl;

		return scriptImpl.apply(scriptImpl, restArgs);
	}).catch(err => {
		logger.error(err.message);
		if(global.verbose) {
			console.log(err);
		}
		process.exit(1);
	});
};

function getExistingCommands(commandDir) {
	return new Promise((resolve, reject) => {
		fs.readdir(commandDir, (err, files) => {
			if (err) {
				return reject(err);
			}
			var commands = files.map(f => f.substring(0, f.lastIndexOf('.')));

			resolve(commands);
		});
	});
}

function getRawCommandStr(command) {
	return command.replace(/-/g, ' ').replace(/_/g, '-');
}