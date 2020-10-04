const cluster = require('cluster');
const EventEmitter = require('events');
const MAX_THREADS = require('os').cpus().length;
function error(text) {
	console.error('[Thread-Process]', new Error(text));
	process.exit(-1);
}
module.exports = class Thread extends EventEmitter {
	constructor(processFunc) {
		super();
		this.active = false;
		this.setMaxListeners(0);
		if (arguments.length) {
			if (typeof processFunc === 'function') this.store(processFunc);
			else error('Invalid parameters in Thread constructor');
		}
	}


	// Sends a store command
	add(processFunc, args) {
		if (!cluster.isMaster) return;
		this.worker.send({
			type: 'store',
			processFunc: processFunc.toString(),
			args
		});
		return true;
	}


	// Opening a thread
	open() {
		if (!cluster.isMaster) return;
		cluster.setupMaster({
			exec: `${__dirname}/threading.js`,
			silent: false
		});
		this.worker = cluster.fork();
		this.worker.setMaxListeners(0);
		this.worker.on('message', msg => {
			if (msg.status === 'stored') this.emit(msg.status, new Error('"stored" is an invalid event'));
			else this.emit(msg.status, msg.value);
		});
		return ++module.exports.OPEN_THREADS;
	}


	// Storing functions
	async store(processFunc, processName) {
		if (!this.worker) this.open();
		if (!this.add(processFunc, {
			name: processFunc.name || processName || 'Anonymous'
		}, 'store')) return false;
		await new Promise(resolve => {
			this.once('stored', () => {
				resolve(true);
			});
		});
		return processFunc;
	}

	async run(functionName, args) {
		if (arguments.length === 1) {
			if (typeof functionName === 'object') {
				args = functionName;
				functionName = null;
			}
		}
		this.worker.send({
			type: 'run',
			targetFunction: functionName,
			args
		});
		this.active = true;
		return await this.wait();
	}

	async runOnce(functionName, args) {
		const temp = await (args ? this.run(functionName, args) : this.run(functionName));
		this.close();
		return temp;
	}

	async wait() {
		return await new Promise(resolve => {
			this.once('completed', msg => {
				this.active = false;
				resolve(msg);
			});
		});
	}

	close() {
		this.worker.send({
			type: 'quit'
		});
		this.worker = null;
		module.exports.OPEN_THREADS--;
	}

	static exec(processFunc, args) {
		const temp = new Thread(processFunc);
		return temp.runOnce(processFunc.name, args);
	}

	static runAll() {
		return Promise.all(arguments);
	}
};
module.exports.MAX_THREADS = MAX_THREADS;
module.exports.OPEN_THREADS = 0;
