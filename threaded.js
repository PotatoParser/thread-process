const cluster = require('cluster');
const EventEmitter = require('events'); 
const MAX_THREADS = require('os').cpus().length;
function error(text){
	console.error("[Thread-Process]", new Error(text));
	process.exit(-1);
}
module.exports = class Thread extends EventEmitter{
	constructor(processFunc){
		super();
		this.active = false;
		this.worker;
		this.setMaxListeners(0);		
		if (arguments.length != 0) {
			if (typeof processFunc === "function") this.store(processFunc);
			else error("Invalid parameters in Thread constructor");
		}
	}
	// Sends a store command
	add(processFunc, args, _type){
		var newFunc = processFunc.toString();
		var _package = {
			type: "store",
			processFunc: newFunc,
			args: args
		}
		if(!cluster.isMaster) return;
		this.worker.send(_package);
		return true;
	}
	// Opening a thread
	open(){
		if(!cluster.isMaster) return;
		cluster.setupMaster({
			exec: __dirname + "/threading.js",
			silent: false
		});
		this.worker = cluster.fork();
		this.worker.setMaxListeners(0);
		this.worker.on("message", (msg)=>{
			if (msg.status != "stored") this.emit(msg.status, msg.value);
			else this.emit(msg.status, new Error(`"stored" is an invalid event`));
		})
		module.exports.OPEN_THREADS++;
		return 0;
	}
	// Storing functions
	async store(processFunc){
		this.open();
		if (!this.add(processFunc, {name: processFunc.name}, "store")) return false;
		var temp = new Promise((resolve)=>{
			this.once("stored", (msg)=>resolve(true));
		});
		return processFunc;
	}
	async run(functionName, args){
		if (arguments.length === 1) {
			if (typeof functionName === 'object') {
				args = functionName;
				functionName = null;
			}
		}
		this.worker.send({type: "run", targetFunction: functionName, args: args});
		this.active = true;
		var returnedData = await this.wait();
		this.emit("complete", returnedData);
		return returnedData;
	}	
	async runOnce(functionName, args){
		var temp = (!args) ? await this.run(functionName) : await this.run(functionName, args);
		this.close();
		return temp;
	}		
	async wait(){
		var final = await new Promise((resolve)=>{
			var other = 0;
			this.once("completed", (msg)=>{
				this.active = false;
				resolve(msg);
			});
		});
		return final;
	}
	close(target){
		this.worker.send({type:"quit"});
		this.worker = null;
		module.exports.OPEN_THREADS--;		
	}	
	static async exec(processFunc, args){
		var temp = new Thread(processFunc);
		var finalData = await temp.runOnce(processFunc.name, args);
		return finalData;
	}
	static async runAll(){
		return await Promise.all(arguments);
	}
}
module.exports.MAX_THREADS = MAX_THREADS;
module.exports.OPEN_THREADS = 0;