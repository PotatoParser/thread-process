/*const EventEmit = require('events');
var other = new EventEmit();
var newData = 0;
other.on('send', ()=>{
	newData++;
	console.log("newData");
});
other.on('lol', ()=>{
	newData++;
	console.log("XD");
});
async function more(){
	other.emit('send');
	other.emit('lol');
		other.emit('send');
	other.emit('lol');
		other.emit('send');
	other.emit('lol');
		other.emit('send');
	other.emit('lol');
}
more();*/
/*const Thread = require('./threaded');
function randomizer(){
	return "LOL";
}
async function main(){
	var temp = new Thread(8);
	//cluster.on("message", function(worker, msg){
		//console.log(msg.value);
	//});
	for (var i = 0; i < 9; i++) {
		console.log("Thread: " + i);
		await temp.storeAsync(randomizer, [], {_delay: 3000});

	}
	//temp.run();
	var allData = await temp.start("runOnce");
	var finalTime = 0;
	for (var i = 0; i <allData.length-1; i++){
		finalTime+=allData[i].time;
	}
	var duration = allData[allData.length-1].duration;
	console.log(Math.round(finalTime/duration *100) + "%");
	finalTime/=allData.length;
	console.log("DONE");
}

main();
*/

/*
var temp = async ()=>{
	return "LOL";
}

console.log(temp.toString());
var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
console.log(AsyncFunction.toString());
var other = new AsyncFunction('a', '{ return a;}');

console.log(other(1));
*/

const thread = require('./threaded');
var randomizer = async ()=>{
	var num = Math.round(Math.random() * 100 + 0);
	var totalString = "";
	for (var i = 0; i < num; i++){
		totalString+=i;
	};
	return totalString;
}
/*var control = (num)=>{
	console.log("The magic number is: " + num);
};*/
function control(){
	return "Hello World";
}
async function main(){
	var temp = new thread();
	//var temp2 = new thread();

	//console.log(thread.MAX_THREADS);
	/*temp.on("end", (data)=>{
		console.log(data);
	});*/
	await temp.store(control);
	//await temp2.store(control);

	//await temp.store(control);	
	//temp.on("complete", (data)=>{console.log(data)});
	//console.log(await temp.run([1]));
	//console.log(await temp.run([2]));
	//console.log(await temp.run([3]));
	console.log(await temp.run());
	//console.log(int32[0]); // 123	
	//temp2.run();
	console.log("OPEN: " + thread.OPEN_THREADS);

	//var temp2 = await thread.exec(control, [10]);
	//console.log(temp2);
	//console.log(await temp.start());
	/*for (var i = 0; i < 8; i++) {
		console.log("Thread: " + i);
		//thread.execute(randomizer, []);
		//await temp.storeAsync(add, [i, i+1], {_delay: 3000});
		//await temp.storeAsync(add, [], {_delay: 3000});
		//await temp.storeAsync(randomizer, [], {_delay: 3000});
		console.log(await temp.store(randomizer, [], {_delay: 3000}));
	}
	*/
	console.log("DONE");
	//temp.run();
	/*var allData = await temp.start("runOnce");
	var finalTime = 0;
	for (var i = 0; i <allData.length-1; i++){
		finalTime+=allData[i].time;
	}
	var duration = allData[allData.length-1].duration;
	console.log(Math.round(finalTime/duration *100) + "%");
	finalTime/=allData.length;
	console.log("DONE");
	*/
}
//main();
//var thread = require("thread-process");
var temp = ()=>{return "Hello World"}
var tp = new thread();
tp.store(temp).then((result)=>{tp.runOnce().then((result2)=>{console.log(result2)});});