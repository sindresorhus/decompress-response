'use strict';
const http = require('http');
const zlib = require('zlib');
const test = require('tape');
const getStream = require('get-stream');
const fn = require('../');
const server = require('./server.js');

const s = server.createServer();
const fixture = 'Compressible response content.\n';

s.on('/', (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Encoding', 'gzip');
	zlib.gzip(fixture, (err, data) => {
		if (err) {
			throw err;
		}

		res.end(data);
	});
});

s.on('/missing-data', (req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Encoding', 'gzip');
	zlib.gzip(fixture, (err, data) => {
		if (err) {
			throw err;
		}

		res.end(data.slice(0, -1));
	});
});

test('setup', t => {
	s.listen(s.port, () => {
		t.end();
	});
});

test('unzip content', t => {
	http.get(s.url, res => {
		res = fn(res);

		t.ok(typeof res.httpVersion === 'string');
		t.ok(res.headers);

		res.setEncoding('utf8');

		getStream(res).then(data => {
			t.equal(data, fixture);
			t.end();
		});
	}).on('err', t.error.bind(t));
});

test('ignore missing data', t => {
	http.get(`${s.url}/missing-data`, res => {
		res = fn(res);

		t.ok(typeof res.httpVersion === 'string');
		t.ok(res.headers);

		res.setEncoding('utf8');

		getStream(res).then(data => {
			t.equal(data, fixture);
			t.end();
		});
	}).on('err', t.error.bind(t));
});

test('cleanup', t => {
	s.close();
	t.end();
});
