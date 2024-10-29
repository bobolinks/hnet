import http from 'http';
import { UDPSocket } from '../src/socket/node';
import { HnetSpot } from '../src/spot';

const spot = new HnetSpot(new UDPSocket(), new UDPSocket(), {
  type: 'cp',
  port: 1903,
  name: 'Remote Controller'
});

spot.on('found', (a) => {
  console.log(a);
});

async function main() {
  spot.start();
  spot.search('*');
}

main();

const s = http.createServer((req: any, res: any) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

s.listen(30481, () => {
  console.log('Server running on port 30481');
});

process.on('exit', (err: any) => {
  console.log(err);
});