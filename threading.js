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
global.yeet = 1;
Object.defineProperty(Object.prototype, "overlap", {
	enumerable: false,
	value: function(newObject){
		for (var key in this){
			if(newObject[key] != undefined){
				this[key] = newObject[key];
			}
		}
	}
});

// Converts the function text into an actual function
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
function analyzeFunction(stringFunc){
	stringFunc = stringFunc.trim();
	var asynchronous = false;
	if (stringFunc.indexOf("async") === 0) {
		stringFunc = stringFunc.substring(5).trim();
		asynchronous = true;
	}
	var other = new RegExp(" ", 'g');
	var firstPart = stringFunc.indexOf(")");
	var firstCurl = stringFunc.indexOf("{");
	var arrow = stringFunc.indexOf("=>");
	if (arrow !== -1 && arrow > firstPart && arrow < firstCurl) {
		stringFunc = stringFunc.substring(0, firstPart+1) + stringFunc.substring(arrow+2);
	}
	firstPart = stringFunc.indexOf(")");
	var necessaryArray = ((stringFunc.substring(stringFunc.indexOf("(")+1, firstPart).replace(other, "")).split(","));
	var finalFunction;	
	if (asynchronous) {
		finalFunction = new AsyncFunction(necessaryArray, stringFunc.substring(firstPart+1, stringFunc.length));
	} else {
		finalFunction = new Function(necessaryArray, stringFunc.substring(firstPart+1, stringFunc.length));
	}
	return finalFunction;
}
global.require = (mdl)=>{
	return require(mdl);
}
global.THREAD_DATA = {};
var FOCUSED_FUNCTION = "";
//var processFunc = [];

// Currently obsolete
var _$setting = {
	_id: null,
	_target: null,
	_delay: "infinite",
	_idle: null,
	_timeout: ()=>{
		if (typeof _$setting._delay != 'number') {
			return;
		}
		clearTimeout(_$setting._idle);
		_$setting._idle = setTimeout(()=>{
			_threadObj.quit();
		}, _$setting._delay);
	}
};
function WARN(msg){
	process.send({status: "warning", error: msg});
}
var _threadObj = {
	quit: (data)=>{
		process.exit(0);
	},
	store: (data)=>{
		THREAD_DATA[data.args.name] = analyzeFunction(data.processFunc);
		FOCUSED_FUNCTION = data.args.name;
		process.send({status: "stored"});
	},
	run: async (data)=>{
		var startTime = new Date();
		FOCUSED_FUNCTION = data.targetFunction || FOCUSED_FUNCTION;		
		var temp = await THREAD_DATA[FOCUSED_FUNCTION].apply(null, data.args);
		process.send({status: "done", value: {value: temp, time: (new Date()).getTime() - startTime.getTime()}});		
	},
	newTarget: (data)=>{
		FOCUSED_FUNCTION = data.target;
	},
	settings: (data)=>{
		_$setting.overlap(data.args);
	}
}

if (cluster.isWorker){
	process.on('message', function(data){
		if (typeof _threadObj[data.type] == 'function') _threadObj[data.type](data);
		WARN("LOL");
	});
}