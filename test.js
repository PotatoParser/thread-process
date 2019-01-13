const thread = require("./threaded");
var temp = ()=>{console.log("Hello World")}
thread.exec(temp);