'use strict';
const http = require('http');
const pify = require('pify');

exports.host = 'localhost';
exports.port = 6765;

exports.createServer = port => {
	const host = exports.host;

	port = port || exports.port;

	const s = http.createServer((req, resp) => {
		s.emit(req.url, req, resp);
	});

	s.host = host;
	s.port = port;
	s.url = `http://${host}:${port}`;
	s.protocol = 'http';

	s.listen = pify(s.listen);
	s.close = pify(s.close);

	return s;
};
