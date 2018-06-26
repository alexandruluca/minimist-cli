require('colors');

module.exports = {
	debug: debug,
	error: logError
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