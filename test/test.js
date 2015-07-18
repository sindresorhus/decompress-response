'use strict';
var http = require('http');
var zlib = require('zlib');
var test = require('tape');
var concatStream = require('concat-stream');
var fn = require('../');
var server = require('./server.js');
var s = server.createServer();
var fixture = 'Compressible response content.\n';

s.on('/', function (req, res) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/plain');
	res.setHeader('Content-Encoding', 'gzip');
	zlib.gzip(fixture, function (err, data) {
		if (err) {
			throw err;
		}

		res.end(data);
	});
});

test('setup', function (t) {
	s.listen(s.port, function () {
		t.end();
	});
});

test('unzip content', function (t) {
	http.get(s.url, function (res) {
		res = fn(res);

		t.ok(typeof res.httpVersion === 'string');
		t.ok(res.headers);

		res.setEncoding('utf8');

		res.pipe(concatStream(function (data) {
			t.equal(data, fixture);
			t.end();
		}));
	}).on('err', t.error.bind(t));
});

test('cleanup', function (t) {
	s.close();
	t.end();
});
