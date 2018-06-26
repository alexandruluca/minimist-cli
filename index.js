#!/usr/bin/env node
global.verbose = process.argv.indexOf('--verbose') > -1;

const path = require('path');
const fs = require('fs');
const logger = require('./lib/logger');

module.exports = function (commandDir) {
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
		commands = commands.map(c => c.replace(/-/g, '$'));
		var command = commands.join('-');
		var commandExists = false;
		var restArgs = [];

		for (var i = 0; i < existingCommands.length; i++) {
			var existingCommand = existingCommands[i];
			if (command.indexOf(existingCommand) === 0) {
				restArgs = command.substring(existingCommand.length + 1).split('-').map(arg => arg.replace(/\$/g, '-'));
				command = existingCommand;
				commandExists = true;
			}
		}

		if (!commandExists) {
			throw new Error(`command '${command}' does not exist`);
		}

		var scriptPath = path.join(commandDir, command);
		var scriptImpl = require(scriptPath);

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