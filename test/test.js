import http from 'node:http';
import zlib from 'node:zlib';
import test from 'ava';
import getStream from 'get-stream';
import pify from 'pify';
import decompressResponse from '../index.js';
import {createServer} from './_server.js';

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

	server.on('/deflateRaw', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-encoding-type', 'text/plain');
		response.setHeader('content-encoding', 'deflate');
		response.end(await zlibP.deflateRaw(fixture));
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

	server.on('/non-compressed', async (request, response) => {
		response.statusCode = 200;
		response.setHeader('content-type', 'text/plain');
		response.setHeader('content-encoding', 'unicorn');
		response.end(fixture);
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

test('decompress raw-deflated content', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/deflateRaw`));

	t.is(typeof response.httpVersion, 'string');
	t.truthy(response.headers);

	response.setEncoding('utf8');

	t.is(await getStream(response), fixture);
});

test('decompress brotli content', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/brotli`));

	t.is(typeof response.httpVersion, 'string');
	t.truthy(response.headers);

	response.setEncoding('utf8');

	t.is(await getStream(response), fixture);
});

test('does not ignore missing data', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/missing-data`));

	t.is(typeof response.httpVersion, 'string');
	t.truthy(response.headers);

	response.setEncoding('utf8');

	await t.throwsAsync(getStream(response), {
		message: 'unexpected end of file',
		code: 'Z_BUF_ERROR',
	});
});

test('preserves custom properties on the stream', async t => {
	let response = await httpGetP(server.url);
	response.customProp = '🦄';
	response = decompressResponse(response);

	t.is(response.customProp, '🦄');

	response.destroy();
});

test('passthrough on non-compressed data', async t => {
	const response = decompressResponse(await httpGetP(`${server.url}/non-compressed`));

	t.is(response.headers['content-encoding'], 'unicorn');

	response.setEncoding('utf8');

	t.is(await getStream(response), fixture);
});

test('original response retains content-encoding and content-length headers', async t => {
	const originalResponse = await httpGetP(server.url);
	const decompressedResponse = decompressResponse(originalResponse);

	t.is(originalResponse.headers['content-encoding'], 'gzip');
	t.truthy(originalResponse.headers['content-length']);
	t.is(decompressedResponse.headers['content-encoding'], undefined);
	t.is(decompressedResponse.headers['content-length'], undefined);

	decompressedResponse.setEncoding('utf8');

	t.is(await getStream(decompressedResponse), fixture);
});
