const Thread = require('./threaded');
const func1 = async () => {
	console.log('Test ONE');
};
const func2 = () => {
	console.log('Test TWO');
};
function func3() {
	console.log('Test THREE');
}
async function func4() {
	console.log('Test FOUR');
}
const func5 = () => console.log('Test FIVE');

const func6 = text => text;
const func7 = time => {
	setTimeout(() => {
		RETURN('Test SEVEN');
	}, time);
};
const func8 = async text => text;
const func9 = [() => {
	console.log(THREAD_DATA);
	console.log('Test NINE');
}];
const func10 = () => {
	const fs = require('fs');
	fs.writeFileSync('test.txt', 'Test TEN');
	const data = fs.readFileSync('test.txt', 'utf8');
	fs.unlinkSync('test.txt');
	return data;
};
const main = async () => {
	const thr = new Thread(func1);
	await thr.store(func2);
	await thr.store(func3);
	await thr.store(func4);
	await thr.store(func5);
	await thr.store(func6);
	await thr.store(func7);
	await thr.store(func8);
	await thr.store(func9[0]);
	await thr.run();
	await thr.run('func1');
	await thr.run('func2');
	await thr.run('func3');
	await thr.run('func4');
	await thr.run('func5');
	console.log(await thr.run('func6', ['Test SIX']));
	await thr.run('func7', [1000]);
	thr.on('returned', data => {
		thr.close();
		console.log(data);
	});
	console.log(await thr.run('func8', ['Test EIGHT']));
};
main();
Thread.exec(func1);
Thread.exec(func10).then(result => {
	console.log(result);
});
