import http from 'http';
import zlib from 'zlib';
import test from 'ava';
import getStream from 'get-stream';
import pify from 'pify';
import {createServer} from './_server';
import decompressResponse from '..';

const zlibP = pify(zlib);
const httpGetP = pify(http.get, {errorFirst: false});
const fixture = 'Compressible response content.\n';

let server;

test.before('setup', async () => {
	server = createServer();

	server.on('/', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-type', 'text/plain');
		response.setHeader('content-encoding', 'gzip');
		response.end(await zlibP.gzip(fixture));
	});

	server.on('/deflate', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-encoding-type', 'text/plain');
		response.setHeader('content-encoding', 'deflate');
		response.end(await zlibP.deflate(fixture));
	});

	server.on('/brotli', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-type', 'text/plain');
		response.setHeader('content-encoding', 'br');
		response.end(await zlibP.brotliCompress(fixture));
	});

	server.on('/missing-data', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-encoding-type', 'text/plain');
		response.setHeader('content-encoding', 'gzip');
		response.end((await zlibP.gzip(fixture)).slice(0, -1));
	});

	await server.listen(server.port);
});

test.after('cleanup', async () => {
	await server.close();
});

test('decompress gzipped content', async t => {
	const response = decompressResponse(await httpGetP(server.url));

	t.truthy(response.destroy);
	t.truthy(response.setTimeout);
	t.truthy(response.socket);
	t.truthy(response.headers);
	t.truthy(response.trailers);
	t.truthy(response.rawHeaders);
	t.truthy(response.statusCode);
	t.truthy(response.httpVersion);
	t.truthy(response.httpVersionMinor);
	t.truthy(response.httpVersionMajor);
	t.truthy(response.rawTrailers);
	t.truthy(response.statusMessage);

	response.setEncoding('utf8');

	t.is(await getStream(response), fixture);

	t.false(response.destroyed);
});

test('decompress deflated content', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/deflate`));

	t.is(typeof response.httpVersion, 'string');
	t.truthy(response.headers);

	response.setEncoding('utf8');

	t.is(await getStream(response), fixture);
});

if (typeof zlib.brotliCompress === 'function') {
	test('decompress brotli content', async t => {
		const response = decompressResponse(await httpGetP(`${server.url}/brotli`));

		t.is(typeof response.httpVersion, 'string');
		t.truthy(response.headers);

		response.setEncoding('utf8');

		t.is(await getStream(response), fixture);
	});
}

test('does not ignore missing data', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/missing-data`));

	t.is(typeof response.httpVersion, 'string');
	t.truthy(response.headers);

	response.setEncoding('utf8');

	await t.throwsAsync(getStream(response), {
		message: 'unexpected end of file',
		code: 'Z_BUF_ERROR'
	});
});

test('preserves custom properties on the stream', async t => {
	let response = await httpGetP(server.url);
	response.customProp = '🦄';
	response = decompressResponse(response);

	t.is(response.customProp, '🦄');

	response.destroy();
});
