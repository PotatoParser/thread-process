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
Object.defineProperty(Object.prototype, "override", {
	enumerable: false,
	value: function(secondObject){
		for (var key in secondObject){
			if (this[key] == undefined) this[key] = secondObject[key];
		}
	}
});
module.exports = class thread extends EventEmitter{
	constructor(maxThreads){
		if (arguments.length == 0){
			const maxCPU = require('os').cpus().length;
			maxThreads = maxCPU;
		}
		super();
		this.allThreads = [];
		this.runningThreads = 0;
		this.threadData = [];
		for (var i = 0; i < maxThreads;i++){
			this.allThreads.push(null);
		}
		this.hiddenEvents = new EventEmitter();
		this.hiddenEvents.on("store", async(targetThread, processFunc, args)=>{
			if (!this.add(targetThread, processFunc, args, "storeAsync")) return;
			var temp = new Promise((resolve)=>{
				this.allThreads[targetThread].once("message", (msg)=>{
					console.log("Success at thread: " + targetThread);
					if (msg.status === "stored") resolve();
				});
			});
			return temp;
		});
	}
	add(targetThread, processFunc, args, _type){
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
		return targetThread;
	}
	store(processFunc, args, settings){
		settings = settings || undefined;
		var targetThread = this.newThread(settings);
		this.add(targetThread, processFunc, args);
	}
	async storeAsync(processFunc, args, settings){
		settings = settings || undefined;
		var targetThread = this.newThread(settings);
		if (!this.add(targetThread, processFunc, args, "storeAsync")) return;
		var temp = new Promise((resolve)=>{
			this.allThreads[targetThread].once("message", (msg)=>{
				if (msg.status === "stored") resolve();
			});
		});
		return temp;
	}
	storeReg(processFunc, args, settings) {
		settings = settings || undefined;
		var targetThread = this.newThread(settings);
		this.hiddenEvents.emit("store", targetThread, processFunc, args);
		//if (!this.add(targetThread, processFunc, args, "storeAsync")) return;
	}
	async start(runType){
		runType = runType || "run";
		//var totalCount = 0;
		var startTime = new Date();
		for (var i = 0; i < this.allThreads.length; i++){
			if (this.allThreads[i] === null) continue;
			this.allThreads[i].send({type: runType});
			this.runningThreads++;
			//totalCount++;
		}
		var final = await this.waitAll();
		this.threadData.push({duration: (new Date()).getTime() - startTime.getTime()});
		var copiedData = this.threadData;
		this.emit("complete", copiedData);
		if (runType == "runOnce") this.kill();
		return copiedData;
	}
	async waitAll(){
		var _runThreads = this.runningThreads;
		var final = await new Promise((resolve)=>{
			var other = 0;
			cluster.on("message", (worker, msg)=>{
				if(msg.status === "done"){
					this.threadData.push(msg.value);
					this.emit("end", msg.value);
					other++;
				}
				if (other === _runThreads){
					for (var i = 0; i < this.allThreads.length; i++) this.allThreads[i] = null;
					resolve();
				}
			});
		});
		return final;
	}
	kill(target){
		if(arguments.length === 0) {
			for (var i = 0; i < this.allThreads.length;i++){
				if (this.allThreads[i] !== null){
					this.allThreads[i].send({type:"quit"});
					this.allThreads[i] = null;
					this.runningThreads--;
				}
			}
			this.threadData = [];
		} else {
			if (this.allThreads[target] !== null){
					this.allThreads[target].send({type:"quit"});
					this.allThreads[target] = null;
					this.runningThreads--;
			}
		}
	}
	static execute(processFunc, args, settings){
		var event = new EventEmitter();
		cluster.setMaxListeners(0);
		//event.setMaxListeners(Infinity);
		var newFunc = processFunc.toString();
		var _package = {
			type: "instant",
			processFunc: newFunc,
			args: args
		}
		if(!cluster.isMaster) return;
		cluster.setupMaster({
			exec: "./threading.js",
			silent: false
		});
		var worker = cluster.fork();
		worker.send(_package);
		cluster.on("message", (worker, msg)=>{
			event.emit("end", msg.value);
		});
	}
	run(targetThread, runType){
		if (arguments.length === 1 && typeof targetThread === 'string')
			runType = targetThread;
		else runType = runType || "run";
		if (typeof targetThread !== 'number') {
			for (var i = 0; i < this.allThreads.length; i++) {
				if (this.allThreads[i] === null) continue;
				this.allThreads[i].send({type:runType});
				this.runningThreads++;
			}
		} else {
			if (this.allThreads[targetThread] === null) return;
			this.allThreads[targetThread].send({type:runType});
			this.runningThreads++;
		}
	}
}