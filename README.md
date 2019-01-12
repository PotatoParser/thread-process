# **Thread Process**
Threading with JS through NodeJS Cluster
# Example Usage
```javascript
var thread = require("thread-process");

function temp() {
	console.log("Hello World -Thread");
}

var thr = new thread();
thr.store(temp);
thr.run();
thr.close();
```
# Thread class
## Properties
```javascript
thread.MAX_THREADS // Gets the maximum CPU count
thread.OPEN_THREADS // Gets the count of how many threads are active
```
## Constructor
```javascript
new thread(); // Constructing a thread with default settings
new thread({_delay: 3000}); // Constructing a thread with custom settings
```
### Settings Available
**_delay: time in ms of inactivity to automatically close the thread**
## Storing functions *(Asynchronous)*
```javascript
thr.store();
```
## Running Functions *(Asynchronous)*
Run the most recent function stored or executed by the thread
```javascript
thr.run();
thr.runOnce(); // Closes the thread after running
thr.run();
```
Run target function stored in the thread
```javascript
thr.run("temp"); // Runs temp()
```
Run with arguments
```javascript
thr.run("temp", [arg1,arg2,arg3]) // temp(arg1, arg2, arg3)
thr.run([arg1,arg2,arg3]) // mostRecentFunction(arg1, arg2, arg3);
```
## Closing Threads
```javascript
thr.close();
```
# Immediate Thread *(Asynchronous)*
Runs a function within a thread and immediately closes the thread upon completion
```javascript
thr.exec(<function>, [arg1,arg2,arg3], <settings>);
```
# Features
+ Supports "require" in "threaded" functions
+ Supports servers on http and https
+ Multiple threads running simultaneously
+ Thread emitted events
+ Thread cleanup

