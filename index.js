'use strict';
var PassThrough = require('stream').PassThrough;
var zlib = require('zlib');
var mimicResponse = require('mimic-response');

module.exports = response => {
	// TODO: Use Array#includes when targeting Node.js 6
	if (['gzip', 'deflate'].indexOf(response.headers['content-encoding']) === -1) {
		return response;
	}

	var unzip = zlib.createUnzip();
	var stream = new PassThrough();

	mimicResponse(response, stream);

	unzip.on('error', err => {
		// Ignore empty response
		if (err.code === 'Z_BUF_ERROR') {
			stream.end();
			return;
		}

		stream.emit('error', err);
	});

	response.pipe(unzip).pipe(stream);

	return stream;
};
