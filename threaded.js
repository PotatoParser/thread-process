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
		//this.threadSettings = settings || {};
		if (arguments.length != 0) {
			if (typeof processFunc === "function") this.store(processFunc);
			else error("Invalid parameters in Thread constructor");
		}
	}	
	add(processFunc, args, _type){
		// Adds in a packaged function (complete with arguments and type);
		_type = _type || "store";
		var newFunc = processFunc.toString();
		var _package = {
			type: _type,
			processFunc: newFunc,
			args: args
		}
		if(!cluster.isMaster) return;
		this.worker.send(_package);
		return true;
	}
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
	async store(processFunc){
		this.open();
		if (!this.add(processFunc, {name: processFunc.name}, "store")) return false;
		var temp = new Promise((resolve)=>{
			this.once("stored", (msg)=>resolve(true));
		});
		//console.log("STORED");
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
		// Return values for all threads that have completed
		//var _runThreads = 0+this.runningThreads;
		var final = await new Promise((resolve)=>{
			var other = 0;
			this.once("completed", (msg)=>{
				//this.emit("end", msg.value);
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