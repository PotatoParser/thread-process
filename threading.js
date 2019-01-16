const cluster = require('cluster');
Object.defineProperty(Object.prototype, "overlap", {
	enumerable: false,
	value: function(newObject){
		for (var key in this){
			if(newObject[key] !== undefined){
				this[key] = newObject[key];
			}
		}
	}
});

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

// Converts the function text into an actual function
function analyzeFunction(stringFunc){
	stringFunc = stringFunc.trim();
	var asynchronous = false;
	if (stringFunc.indexOf("async") === 0) {
		stringFunc = stringFunc.substring(5).trim();
		asynchronous = true;
	}
	var parameters = [];
	var body = "";
	var indexFunc = stringFunc.indexOf("function");
	var indexArrow = stringFunc.indexOf("=>");
	if (indexFunc !== -1 || indexArrow !== -1) {
		if ((indexFunc < indexArrow && indexFunc !== -1) || indexArrow === -1) {
			body = stringFunc.substring(stringFunc.indexOf("{"));
			var temp = stringFunc.substring(stringFunc.indexOf("(")+1, stringFunc.indexOf(")"));
			parameters = temp.replace(new RegExp(" ", 'g'), "").split(",");	
		} else if ((indexArrow < indexFunc && indexArrow !== -1) || indexFunc === -1) {
			body = stringFunc.substring(indexArrow+2);
			if (stringFunc.indexOf("{") === stringFunc.indexOf("}")) body = `{${body}}`;
			var temp = stringFunc.substring(stringFunc.indexOf("(")+1, stringFunc.indexOf(")"));
			parameters = temp.replace(new RegExp(" ", 'g'), "").split(",");
		}
	}
	var finalFunction;	
	if (asynchronous) {
		finalFunction = new AsyncFunction(parameters, body);
	} else {
		finalFunction = new Function(parameters, body);
	}
	return finalFunction;	
}

// Defining global variables
global.require = (mdl)=>{
	return require(mdl);
}
global.THREAD_DATA = {};
global.FOCUSED_FUNCTION = "";
global.RETURN = (data)=>{
	process.send({status: "returned", value: data});
};

// Used to process commands
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

// Queue system
async function execute(){
	if (QUEUE.length > 0) {
		if (typeof _threadObj[QUEUE[0].type] === 'function') await _threadObj[QUEUE[0].type](QUEUE[0]);	
		QUEUE.splice(0,1);		
		execute();	
	}
}
process.on('message', async (data)=>{
	if (QUEUE.length === 0) {
		QUEUE.push(data);
		execute();
	} else QUEUE.push(data);
});