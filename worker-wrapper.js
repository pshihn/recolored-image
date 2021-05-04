const fs = require('fs');

// read wrapper
console.log('**Worker wrapper**');
console.log('Reading built files...');
const host = fs.readFileSync('lib/recolored-image.min.js', { encoding: 'utf8' }).toString();
const workerSrouce = fs.readFileSync('lib/worker.min.js', { encoding: 'utf8' }).toString();

const split = host.split('"/lib/worker.min.js"');

const bufferObj = Buffer.from(workerSrouce, "utf8");
const base64String = bufferObj.toString("base64");

// write embed.js
console.log('Writing index.js...');
fs.writeFileSync('lib/index.js', [
  split[0],
  '`data:text/javascript;base64,',
  base64String,
  '`',
  split[1]
].join(''));