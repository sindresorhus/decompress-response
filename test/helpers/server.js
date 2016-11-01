'use strict';
var http = require('http');
var Promise = require('pinkie-promise');
var pify = require('pify');

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

	s.listen = pify(s.listen, Promise);
	s.close = pify(s.close, Promise);

	return s;
};
