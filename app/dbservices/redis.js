import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'WkVmMF1efqc5b4Xt0Hvuw5zhPtzVq7s4',
    socket: {
        host: 'redis-15800.c90.us-east-1-3.ec2.redns.redis-cloud.com',
        port: 15800
    }
});

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const result = await client.get('foo');
console.log(result)  // >>> bar

