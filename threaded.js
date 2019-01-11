/*
   Copyright [2018] [Wilson Nguyen]

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/
const cluster = require('cluster');
const EventEmitter = require('events'); 
const MAX_THREADS = require('os').cpus().length;
module.exports = class thread extends EventEmitter{
	constructor(settings){
		super();
		this.threadSettings = settings || {};	
		this.active = false;
		this.worker;
		this.setMaxListeners(0);	
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
			exec: "./threading.js",
			silent: false
		});
		this.worker = cluster.fork();
		this.threadSettings["_id"] = 0;
		this.worker.send({type: "settings", args:this.threadSettings});
		this.worker.setMaxListeners(0);
		this.worker.on("message", (msg)=>{
			this.emit(msg.status, msg);
		})
		module.exports.OPEN_THREADS++;
		return 0;
	}
	async store(processFunc){
		this.open();
		if (!this.add(processFunc, {name: processFunc.name}, "store")) return false;
		var temp = new Promise((resolve)=>{
			this.once("stored", ()=>resolve(true));
		});
		//console.log("STORED");
		return temp;
	}
	async run(functionName, args){
		//console.log("RUNNING");
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
		var _runThreads = 0+this.runningThreads;
		var allData = [];
		var final = await new Promise((resolve)=>{
			var other = 0;
			this.once("done", (msg)=>{
				this.emit("end", msg.value);
				this.active = false;
				resolve(msg.value);
			});
		});
		return final;
	}
	close(target){
		this.worker.send({type:"quit"});
		this.worker = null;
		module.exports.OPEN_THREADS--;		
	}	
	static async exec(processFunc, args, settings){
		var temp = new thread(settings);
		await temp.store(processFunc);
		return await temp.runOnce(processFunc.name, args);
	}
}
module.exports.MAX_THREADS = MAX_THREADS;
module.exports.OPEN_THREADS = 0;