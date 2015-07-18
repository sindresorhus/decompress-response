'use strict';
var http = require('http');

exports.host = 'localhost';
exports.port = 6765;

exports.createServer = function (port) {
	var host = exports.host;

	port = port || exports.port;

	var s = http.createServer(function (req, resp) {
		s.emit(req.url, req, resp);
	});

	s.host = host;
	s.port = port;
	s.url = 'http://' + host + ':' + port;
	s.protocol = 'http';

	return s;
};
