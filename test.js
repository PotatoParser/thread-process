const thread = require("./threaded");
var temp = async (text)=>{
    console.log(`Async! ${text}`);
}
async function main(){
    var tp = new thread();
    await tp.store(temp);
    await tp.runOnce(["~ Thread"]);
}
main();