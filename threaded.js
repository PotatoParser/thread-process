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
		this.threadSettings = settings;	
		this.active = false;	
	}	
	add(targetThread, processFunc, args, _type){
		// Adds in a packaged function (complete with arguments and type);
		if (!this.allThreads[targetThread]) return;
		_type = _type || "store";
		var newFunc = processFunc.toString();
		var _package = {
			type: _type,
			processFunc: newFunc,
			args: args
		}
		if(!cluster.isMaster) return;
		this.allThreads[targetThread].send(_package);
		return true;
	}
	newThread(settings){
		// Opens a new thread
		var targetThread = this.allThreads.indexOf(null);
		if (targetThread == -1){
			process.emitWarning("No more threads available");
			return;
		}
		if(!cluster.isMaster) return;
		cluster.setupMaster({
			exec: "./threading.js",
			silent: false
		});
		this.allThreads[targetThread] = cluster.fork();
		settings = settings || {};
		settings._id = targetThread;
		this.allThreads[targetThread].send({type: "settings", args:settings});
		this.allThreads[targetThread].setMaxListeners(0);
		this.allThreads[targetThread].on("message", (msg)=>{
			console.log(msg);
			if (msg.status == "warning") {
				//process.emitWarning(`[Thread: ${targetThread}] - ${msg.error}`);			
				//this.emit("warning", {thread: targetThread, msg: msg.error});
			}
		});
		module.exports.OPEN_THREADS++;
		return targetThread;
	}
	/*store(processFunc, args, settings){
		settings = settings || undefined;
		var targetThread = this.newThread(settings);
		this.add(targetThread, processFunc, args);
	}*/
	async store(targetThread, processFunc){
		// Stores a function and sends a message to the screen when it is done storing.
		if (arguments.length === 1) {
			processFunc = targetThread;
			targetThread = false;
		}
		if (typeof targetThread === 'number') {
			targetThread = targetThread || this.newThread(this.threadSettings);
		} else {
			if (this.allThreads[0] === null) targetThread = this.newThread(this.threadSettings);
			else targetThread = 0;
		}
		//console.log("THREAD" + targetThread);
		//targetThread = (typeof targetThread === 'number') ? targetThread || this.newThread(this.threadSettings) : 0;
		if (!this.add(targetThread, processFunc, {name: processFunc.name}, "store")) return false;
		var temp = new Promise((resolve)=>{
			this.allThreads[targetThread].once("message", (msg)=>{
				if (msg.status === "stored") resolve(true);
			});
		});
		//console.log("STORED");
		return temp;
	}
	/*storeReg(processFunc, args, settings) {
		// Special type of storing?
		settings = settings || undefined;
		var targetThread = this.newThread(settings); // Opens a thread with all threads running
		this.hiddenEvents.emit("store", targetThread, processFunc, args);
		//if (!this.add(targetThread, processFunc, args, "storeAsync")) return;
	}*/
	async run(functionName, args){
		//console.log("RUNNING");
		if (arguments.length === 1) {
			if (typeof functionName === 'object') {
				args = functionName;
				functionName = null;
			}
		}
		//var totalCount = 0;
		//var startTime = new Date();
		for (var i = 0; i < this.allThreads.length; i++){
			if (this.allThreads[i] === null) continue;
			this.allThreads[i].send({type: "run", targetFunction: functionName, args: args});
			this.runningThreads++;
			//totalCount++;
		}
		//var allData = [];		
		var returnedData = await this.waitAll();
		//allData.push(final);
		//allData.push({duration: (new Date()).getTime() - startTime.getTime()});
		//var copiedData = allData;
		this.emit("complete", returnedData);
		//if (runType == "runOnce") this.close();
		return returnedData;
	}	
	async runOnce(functionName, args){
		var temp = await this.run(functionName, args);
		this.close();
		return temp;
	}		
	async waitAll(){
		// Return values for all threads that have completed
		var _runThreads = 0+this.runningThreads;
		var allData = [];
		var final = await new Promise((resolve)=>{
			var other = 0;
			cluster.on("message", (worker, msg)=>{
				console.log(msg.status);
				if(msg.status === "done"){
					allData.push(msg.value);
					this.emit("end", msg.value);
					other++;
				}
				if (other === _runThreads){
					//for (var i = 0; i < this.allThreads.length; i++) this.allThreads[i] = null;
					resolve(allData);
				}
			});
		});
		this.runningThreads = 0;
		if (_runThreads === 1) return final[0];
		return final;
	}
	close(target){
			// Kills the target thread or all threads
			/*if(arguments.length === 0) {
				for (var i = 0; i < this.allThreads.length;i++){
					if (this.allThreads[i] !== null){
						this.allThreads[i].send({type:"quit"});
						this.allThreads[i] = null;
						this.runningThreads--;
						module.exports.OPEN_THREADS--;
					}
				}
				this.threadData = [];
			} else {
				if (this.allThreads[target] !== null){
						this.allThreads[target].send({type:"quit"});
						this.allThreads[target] = null;
						this.runningThreads--;
				} else {
					// If the thread has not been opened
				}
			}*/
		}	
	static async exec(processFunc, args, settings){
		var temp = new thread(settings);
		await temp.store(processFunc);
		return await temp.runOnce(processFunc.name, args);
	}
}
module.exports.MAX_THREADS = MAX_THREADS;
module.exports.OPEN_THREADS = 0;