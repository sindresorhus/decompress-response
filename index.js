'use strict';
const PassThrough = require('stream').PassThrough;
const zlib = require('zlib');
const mimicResponse = require('mimic-response');

module.exports = response => {
	// TODO: Use Array#includes when targeting Node.js 6
	if (['gzip', 'deflate', 'br'].indexOf(response.headers['content-encoding']) === -1) {
		return response;
	}

	const isBrotli = response.headers['content-encoding'] === 'br';

	if (isBrotli && typeof zlib.createBrotliDecompress !== 'function') {
		return response;
	}

	const decompress = isBrotli ? zlib.createBrotliDecompress() : zlib.createUnzip();
	const stream = new PassThrough();

	mimicResponse(response, stream);

	decompress.on('error', err => {
		// Ignore empty response
		if (err.code === 'Z_BUF_ERROR') {
			stream.end();
			return;
		}

		stream.emit('error', err);
	});

	response.pipe(decompress).pipe(stream);

	return stream;
};
