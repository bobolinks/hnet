import http from 'http';
import { UDPSocket } from '../src/socket/node';
import { HnetSpot } from '../src/spot';

const spot = new HnetSpot(new UDPSocket(), new UDPSocket());

spot.on('alive', (a: any) => {
  console.log(a);
});

async function main() {
  spot.start();
}

main();

const s = http.createServer((req: any, res: any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

s.listen(30480, () => {
  console.log('Server running on port 30480');
});

process.on('exit', (err: any) => {
  console.log(err);
});