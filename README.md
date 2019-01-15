![Thread Process](https://github.com/PotatoParser/threadProcess/blob/master/thread-process.png?raw=true)
Simple Threading with JS through NodeJS Cluster
```javascript
const thread = require("thread-process");

function temp() {
    console.log("Hello World ~Thread");
}

var thr = new thread();
thr.store(temp);
thr.run();
thr.close();
```
# Table of Contents
+ [Features](#features)
+ [Installing](#installing)
+ [Initializing](#initializing)
+ [Properties](#properties)
+ [Thread Class](#thread-class)
	+ [Constructor](#constructor)
	+ [Storing functions](#storing-functions-asynchronous)
	+ [Global Variables Accessible](#global-variables-accessible)
	+ [Running Functions](#running-functions-asynchronous)
	+ [Running Multiple Threads](#running-multiple-threads-asynchronous)
    + [Events](#events)
	+ [Closing Threads](#closing-threads)
+ [Immediate Thread](#immediate-thread-asynchronous)
+ [Example Usage](#example-usage)

# Features
+ Supports "require" in "threaded" functions
+ Supports storing both synchronous and asynchronous functions
+ Multiple threads running simultaneously
+ Thread emitted events
+ Thread cleanup

# Installing
Requires prior installation of NodeJS
```
$ npm install thread-process
```
# Initializing
```javascript
const thread = require("thread-process");
```
# Properties
```javascript
thread.MAX_THREADS // Gets the maximum CPU count
thread.OPEN_THREADS // Gets the count of how many threads are active
```
# Thread Class
## Constructor
```javascript
new thread(); // Constructing a thread with default settings
new thread(function); // Stores a function
```
## Storing Functions *(Asynchronous)*
*(Async) returns the function stored*
```javascript
thr.store(function);
```
## Global Variables Accessible
```javscript
THREAD_DATA // (Object) Contains all the functions stored
FOCUSED_FUNCTION // (String) The most recent function
RETURN(data); // Sends data from the function to the main thread
```
## Running Functions *(Asynchronous)*
Run the most recent function stored or executed by the thread

*(Async) returns the data returned by the function executed*
```javascript
thr.run();
thr.runOnce(); // Closes the thread after running
```
Run target function stored in the thread
```javascript
thr.run("temp"); // Runs temp()
```
Run with arguments
```javascript
thr.run(function.name, [arg1,arg2,arg3]) // temp(arg1, arg2, arg3)
thr.run([arg1,arg2,arg3])
```
## Running Multiple Threads *(Asynchronous)*

*(Async) returns data as an Array*
```javascript
thread.runAll(thr.run(), ...);
```
## Events
Event handling can make life much easier!
```javascript
thr.on("warning", (data)=>{}); // Contains warning data
thr.on("completed", (data)=>{}); // Contains the returned data
thr.on("returned", (data)=>{}); // Contains data returned by RETURN(data);
```
## Closing Threads
```javascript
thr.close();
```
# Immediate Thread *(Asynchronous)*
Runs a function within a thread and immediately closes the thread upon completion

*(Async) returns the data returned by the function executed*
```javascript
thread.exec(function);
thread.exec(function, [arg1,arg2,arg3]);
```
# Example Usage
Using thread variables
```javascript
var temp = (text)=>{
    console.log(THREAD_DATA);
    console.log(FOCUSED_FUNCTION); // Outputs "temp"
}
async function main(){
    var tp = new thread();
    await tp.store(temp);
    await tp.runOnce();
}
main();
```
Asynchronous management of threads & passing values
```javascript
var temp = async (text)=>{
    console.log(`Async! ${text}`);
}
async function main(){
    var tp = new thread();
    await tp.store(temp);
    await tp.runOnce(["~ Thread"]);
}
main();
```
Multiple stored functions
```javascript
var func1 = ()=>{console.log("First function!")}
var func2 = ()=>{console.log("Second function!")}
async function main(){
    var tp = new thread();
    await tp.store(func1);
    await tp.store(func2);
    await tp.runOnce("func1");
}
main();
```
Using **then** instead of async/await
```javascript
var temp = ()=>{console.log("Hello World!")}
var tp = new thread();
tp.store(temp).then((result)=>{tp.runOnce();});
```
Running simultaneous threads
```javascript
var temp = ()=>{return "Hello";}
var tp = new thread(temp);
var tp2 = new thread(temp);
thread.runAll(tp.runOnce(), tp.runOnce()).then((result)=>console.log(result));
```
Running with events
```javascript
var temp = ()=>{RETURN("Hello")};
var tp = new thread(temp);
tp.on("returned", (data)=>{
    console.log(data);
    tp.close();
});
tp.run();
```