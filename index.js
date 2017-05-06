'use strict';
const PassThrough = require('stream').PassThrough;
const zlib = require('zlib');

module.exports = res => {
	// TODO: Use Array#includes when targeting Node.js 6
	if (['gzip', 'deflate'].indexOf(res.headers['content-encoding']) === -1) {
		return res;
	}

	const unzip = zlib.createUnzip();
	const stream = new PassThrough();

	// https://nodejs.org/api/http.html#http_class_http_incomingmessage
	stream.destroy = res.destroy.bind(res);
	stream.setTimeout = res.setTimeout.bind(res);
	stream.socket = res.socket;
	stream.headers = res.headers;
	stream.trailers = res.trailers;
	stream.rawHeaders = res.rawHeaders;
	stream.statusCode = res.statusCode;
	stream.httpVersion = res.httpVersion;
	stream.rawTrailers = res.rawTrailers;
	stream.statusMessage = res.statusMessage;

	unzip.on('error', err => {
		if (err.code === 'Z_BUF_ERROR') {
			stream.end();
			return;
		}

		stream.emit('error', err);
	});

	res.pipe(unzip).pipe(stream);

	return stream;
};
