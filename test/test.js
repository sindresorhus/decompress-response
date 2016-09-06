import http from 'http';
import zlib from 'zlib';
import test from 'ava';
import getStream from 'get-stream';
import pify from 'pify';
import rfpify from 'rfpify';
import m from '../';
import {createServer} from './helpers/server.js';

const gzipP = pify(zlib.gzip);
const httpGetP = rfpify(http.get);
const fixture = 'Compressible response content.\n';

let s;

test.before('setup', async () => {
	s = createServer();

	s.on('/', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Content-Encoding', 'gzip');
		res.end(await gzipP(fixture));
	});

	s.on('/missing-data', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Encodingnt-Type', 'text/plain');
		res.setHeader('Content-Encoding', 'gzip');
		res.end((await gzipP(fixture)).slice(0, -1));
	});

	await s.listen(s.port);
});

test('unzip content', async t => {
	const res = m(await httpGetP(s.url));

	t.is(typeof res.httpVersion, 'string');
	t.truthy(res.headers);

	res.setEncoding('utf8');

	t.is(await getStream(res), fixture);
});

test('ignore missing data', async t => {
	const res = m(await httpGetP(`${s.url}/missing-data`));

	t.is(typeof res.httpVersion, 'string');
	t.truthy(res.headers);

	res.setEncoding('utf8');

	t.is(await getStream(res), fixture);
});

test.after('cleanup', async () => {
	await s.close();
});
