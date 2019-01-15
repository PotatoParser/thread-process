const thread = require("./threaded");
var temp = ()=>console.log("OOF");
console.log(temp);
var tp = new thread(temp);
tp.on("returned", (data)=>{
    console.log(data);
    tp.close();
});
tp.run();