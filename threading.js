const cluster = require('cluster');
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
global.FOCUSED_FUNCTION = "";
global.RETURN = (data)=>{
	process.send({status: "returned", value: data});
};
//var processFunc = [];

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
		//var startTime = new Date();
		FOCUSED_FUNCTION = data.targetFunction || FOCUSED_FUNCTION;		
		var temp = await THREAD_DATA[FOCUSED_FUNCTION].apply(null, data.args);
		process.send({status: "completed", value: temp});		
	},
	newTarget: (data)=>{
		FOCUSED_FUNCTION = data.target;
	}
}
var QUEUE = [];
//if (cluster.isWorker){
async function execute(){
	if (QUEUE.length > 0) {
		if (typeof _threadObj[QUEUE[0].type] == 'function') await _threadObj[QUEUE[0].type](QUEUE[0]);	
		QUEUE.splice(0,1);		
		execute();	
	}
}
	process.on('message', async (data)=>{
		if (QUEUE.length == 0) {
			QUEUE.push(data);
			execute();
			/*if (typeof _threadObj[QUEUE[0].type] == 'function') await _threadObj[QUEUE[0].type](QUEUE[0]);
			QUEUE.splice(0,1);*/
		} else {
			QUEUE.push(data);
		}
		//if (typeof _threadObj[data.type] == 'function') await _threadObj[data.type](data);
		//WARN("LOL");
	});
//}