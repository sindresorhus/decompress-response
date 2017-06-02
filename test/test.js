import http from 'http';
import zlib from 'zlib';
import test from 'ava';
import getStream from 'get-stream';
import pify from 'pify';
import m from '..';
import {createServer} from './helpers/server';

const zlibP = pify(zlib);
const httpGetP = pify(http.get, {errorFirst: false});
const fixture = 'Compressible response content.\n';

let s;

test.before('setup', async () => {
	s = createServer();

	s.on('/', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('content-type', 'text/plain');
		res.setHeader('content-encoding', 'gzip');
		res.end(await zlibP.gzip(fixture));
	});

	s.on('/deflate', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('content-encoding-type', 'text/plain');
		res.setHeader('content-encoding', 'deflate');
		res.end(await zlibP.deflate(fixture));
	});

	s.on('/missing-data', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('content-encoding-type', 'text/plain');
		res.setHeader('content-encoding', 'gzip');
		res.end((await zlibP.gzip(fixture)).slice(0, -1));
	});

	await s.listen(s.port);
});

test.after('cleanup', async () => {
	await s.close();
});

test('decompress gzipped content', async t => {
	const res = m(await httpGetP(s.url));

	t.truthy(res.destroy);
	t.truthy(res.setTimeout);
	t.truthy(res.socket);
	t.truthy(res.headers);
	t.truthy(res.trailers);
	t.truthy(res.rawHeaders);
	t.truthy(res.statusCode);
	t.truthy(res.httpVersion);
	t.truthy(res.httpVersionMinor);
	t.truthy(res.httpVersionMajor);
	t.truthy(res.rawTrailers);
	t.truthy(res.statusMessage);

	res.setEncoding('utf8');

	t.is(await getStream(res), fixture);
});

test('decompress deflated content', async t => {
	const res = m(await httpGetP(`${s.url}/deflate`));

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

test('preserves custom properties on the stream', async t => {
	let res = await httpGetP(s.url);
	res.customProp = '🦄';
	res = m(res);

	t.is(res.customProp, '🦄');

	res.destroy();
});
