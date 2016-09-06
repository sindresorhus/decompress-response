'use strict';
const http = require('http');

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

	return s;
};
