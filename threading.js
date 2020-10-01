require('cluster');

Object.defineProperty(Object.prototype, 'overlap', {
	value(newObject) {
		for (const key in this) if (typeof newObject[key] !== 'undefined') this[key] = newObject[key];
	}
});

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

// Converts the function text into an actual function
function analyzeFunction(stringFunc) {
	let asynchronous, body, match, finalFunction;

	stringFunc = stringFunc.trim();
	if (stringFunc.indexOf('async') === 0) {
		stringFunc = stringFunc.substring(5).trim();
		asynchronous = true;
	}

	if (stringFunc.indexOf('function') === 0) match = /function\W*\w*\W*\((?<params>[^)]*?)\)/g.exec(stringFunc);
	else match = /\(?(?<params>[^)]*?)\)?\W*?(=>)/g.exec(stringFunc);
	body = stringFunc.substring(match[0].length).trim();

	if (body[0] === '{' && body[body.length - 1] === '}') body = body.substring(1, body.length - 1);
	else body = `return ${body}`;

	const parameters = match.groups.params.split(',').map(i => i.trim());
	if (asynchronous) finalFunction = new AsyncFunction(parameters, body);
	else finalFunction = new Function(parameters, body);


	return finalFunction;
}

// Defining global variables
global.require = mdl => require(mdl);
global.THREAD_DATA = {};
global.FOCUSED_FUNCTION = '';
global.RETURN = data => {
	process.send({
		status: 'returned',
		value: data
	});
};

// Used to process commands
const threadInstance = {
	quit: () => {
		process.exit(0);
	},
	store: data => {
		global.THREAD_DATA[data.args.name] = analyzeFunction(data.processFunc);
		global.FOCUSED_FUNCTION = data.args.name;
		process.send({
			status: 'stored'
		});
	},
	run: async data => {
		global.FOCUSED_FUNCTION = data.targetFunction || global.FOCUSED_FUNCTION;
		process.send({
			status: 'completed',
			value: await global.THREAD_DATA[global.FOCUSED_FUNCTION].apply(null, data.args)
		});
	},
	newTarget: data => {
		global.FOCUSED_FUNCTION = data.target;
	}
};
const QUEUE = [];

// Queue system
async function execute() {
	if (QUEUE.length > 0) {
		if (typeof threadInstance[QUEUE[0].type] === 'function') await threadInstance[QUEUE[0].type](QUEUE[0]);
		QUEUE.splice(0, 1);
		execute();
	}
}
process.on('message', async data => {
	if (QUEUE.length === 0) {
		QUEUE.push(data);
		execute();
	} else {
		QUEUE.push(data);
	}
});
