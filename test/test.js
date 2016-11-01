import http from 'http';
import zlib from 'zlib';
import test from 'ava';
import getStream from 'get-stream';
import pify from 'pify';
import rfpify from 'rfpify';
import Promise from 'pinkie-promise';
import m from '../';
import {createServer} from './helpers/server.js';

const zlibP = pify(zlib, Promise);
const httpGetP = rfpify(http.get, Promise);
const fixture = 'Compressible response content.\n';

let s;

test.before('setup', async () => {
	s = createServer();

	s.on('/', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.setHeader('Content-Encoding', 'gzip');
		res.end(await zlibP.gzip(fixture));
	});

	s.on('/deflate', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Encodingnt-Type', 'text/plain');
		res.setHeader('Content-Encoding', 'deflate');
		res.end(await zlibP.deflate(fixture));
	});

	s.on('/missing-data', async (req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Encodingnt-Type', 'text/plain');
		res.setHeader('Content-Encoding', 'gzip');
		res.end((await zlibP.gzip(fixture)).slice(0, -1));
	});

	await s.listen(s.port);
});

test('unzip gzipped content', async t => {
	const res = m(await httpGetP(s.url));

	t.is(typeof res.httpVersion, 'string');
	t.truthy(res.headers);

	res.setEncoding('utf8');

	t.is(await getStream(res), fixture);
});

test('unzip deflated content', async t => {
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

test.after('cleanup', async () => {
	await s.close();
});
