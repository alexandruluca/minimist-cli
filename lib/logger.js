require('colors');

module.exports = {
	debug: debug,
	error: logError,
	info: logInfo
};

function debug() {
	if(global.verbose) {
		console.log.apply(console, arguments);
	}
}

function logError(message, namespace) {
	namespace = namespace ? `[${namespace}]` : '';
	var prefix = `${namespace}[ERROR]`.red;

	console.error('%s %s', prefix, message);
}

function logInfo(message, namespace) {
	namespace = namespace ? `[${namespace}]` : '';
	var prefix = `${namespace}[INFO]`.blue;

	console.error('%s %s', prefix, message);
}