const thread = require("./threaded");
var temp = (text)=>{
    console.log(THREAD_DATA);
    console.log(FOCUSED_FUNCTION); // Outputs "temp"
}
async function main(){
    var tp = new thread("oof");
    await tp.store(temp);
    await tp.runOnce();
}
main();