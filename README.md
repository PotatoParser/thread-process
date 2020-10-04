![Thread Process](https://github.com/PotatoParser/threadProcess/blob/master/thread-process.png?raw=true)
[![Build Status](https://api.travis-ci.com/PotatoParser/thread-process.svg?branch=master)](https://travis-ci.com/PotatoParser/thread-process)

Simple Threading with JS through NodeJS Cluster
```javascript
const thread = require("thread-process");

function temp() {
    console.log("Hello World ~Thread");
}

const thr = new Thread();
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
	+ [Global Variables Accessible](#global-constiables-accessible)
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
Thread.MAX_THREADS // Gets the maximum CPU count
Thread.OPEN_THREADS // Gets the count of how many threads are active
```
# Thread Class
## Constructor
```javascript
new Thread(); // Constructing a thread with default settings
new Thread(function); // Stores a function
```
## Storing Functions *(Asynchronous)*
*(Async) returns the function stored*
```javascript
thr.store(function);
thr.store(function, function.name); // Override the function name or provide one that is missing
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
Thread.runAll(thr.run(), ...);
```
## Events
Event handling can make life much easier!
```javascript
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
Thread.exec(function);
Thread.exec(function, [arg1,arg2,arg3]);
```
# Example Usage
Using thread constiables
```javascript
const temp = (text)=>{
    console.log(THREAD_DATA);
    console.log(FOCUSED_FUNCTION); // Outputs "temp"
}
async function main(){
    const tp = new Thread();
    await tp.store(temp);
    await tp.runOnce();
}
main();
```
Asynchronous management of threads & passing values
```javascript
const temp = async (text)=>{
    console.log(`Async! ${text}`);
}
async function main(){
    const tp = new Thread();
    await tp.store(temp);
    await tp.runOnce(["~ Thread"]);
}
main();
```
Multiple stored functions
```javascript
const func1 = ()=>{console.log("First function!")}
const func2 = ()=>{console.log("Second function!")}
async function main(){
    const tp = new Thread();
    await tp.store(func1);
    await tp.store(func2);
    await tp.runOnce("func1");
}
main();
```
Using **then** instead of async/await
```javascript
const temp = ()=>{console.log("Hello World!")}
const tp = new Thread();
tp.store(temp).then((result)=>{tp.runOnce();});
```
Running simultaneous threads
```javascript
const temp = ()=>{return "Hello";}
const tp = new Thread(temp);
const tp2 = new Thread(temp);
Thread.runAll(tp.runOnce(), tp.runOnce()).then((result)=>console.log(result));
```
Running with events
```javascript
const temp = ()=>{RETURN("Hello")};
const tp = new Thread(temp);
tp.on("returned", (data)=>{
    console.log(data);
    tp.close();
});
tp.run();
```
