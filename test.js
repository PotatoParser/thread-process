var thread = require("./threaded");
var func1 = async ()=>{
	console.log("Test ONE");
}
var func2 = ()=>{
	console.log("Test TWO");
}
function func3(){
	console.log("Test THREE");
}
async function func4(){
	console.log("Test FOUR");
}
var func5 = ()=>console.log("Test FIVE");

var func6 = (text)=>{
	return text;
}
var func7 = (time)=>{
	setTimeout(()=>{
		RETURN("Test SEVEN");
	}, time);
}
var func8 = async (text)=>{
	return text;
}
var func9 = [()=>{
	console.log(THREAD_DATA);
	console.log("Test NINE");
}];
var func10 = ()=>{
	var fs = require("fs");
	fs.writeFileSync("test.txt", "Test TEN");
	var data = fs.readFileSync("test.txt", "utf8");
	fs.unlinkSync("test.txt");
	return data;
}
var main = async ()=>{
	var thr = new thread(func1);
	await thr.store(func2);
	await thr.store(func3);
	await thr.store(func4);
	await thr.store(func5);
	await thr.store(func6);
	await thr.store(func7);
	await thr.store(func8);
	await thr.store(func9[0]);
	await thr.run();
	await thr.run("func1");
	await thr.run("func2");
	await thr.run("func3");
	await thr.run("func4");
	await thr.run("func5");
	console.log(await thr.run("func6", ["Test SIX"]));
	await thr.run("func7", [1000]);
	thr.on("returned", (data)=>{
		thr.close();
		console.log(data);
	});
	console.log(await thr.run("func8", ["Test EIGHT"]));	
}
main();
thread.exec(func1);
thread.exec(func10).then((result)=>{console.log(result)});