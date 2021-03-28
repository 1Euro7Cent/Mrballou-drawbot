const { spawn } = require('child_process');

const python = spawn('python', ['gui.py']);
const aborter = spawn('python', ['aborter.py']);
const node = spawn('node', ['./server/index.js']);

python.stdout.on('data', function (data) {
    console.log(`python:`, data.toString());
});
python.on('close', (code) => {
    console.log(`child process 'gui' close all stdio with code ${code}`);
});

aborter.stdout.on('data', function (data) {
    console.log(`aborter:`, data.toString());
});
aborter.on('close', (code) => {
    console.log(`child process 'aborter' close all stdio with code ${code}`);
});




node.stdout.on('data', function (data) {
    console.log(`node:`, data.toString());
});
node.on('close', (code) => {
    console.log(`child process 'server' close all stdio with code ${code}`);
});
