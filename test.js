const thread = require("./threaded");
var temp = async ()=>console.log("OOF");
var tp = new thread(temp);
tp.runOnce();