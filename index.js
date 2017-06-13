'use strict';
const PassThrough = require('stream').PassThrough;
const zlib = require('zlib');
const mimicResponse = require('mimic-response');
const iltorbDecompress = require('iltorb').decompressStream;

module.exports = response => {
	// TODO: Use Array#includes when targeting Node.js 6
	if (['gzip', 'deflate', 'br'].indexOf(response.headers['content-encoding']) === -1) {
		return response;
	}

	const decompress = response.headers['content-encoding'] === 'br' ? iltorbDecompress() : zlib.createUnzip();
	const stream = new PassThrough();

	mimicResponse(response, stream);

	decompress.on('error', err => {
		if (err.code === 'Z_BUF_ERROR') {
			stream.end();
			return;
		}

		stream.emit('error', err);
	});

	response.pipe(decompress).pipe(stream);

	return stream;
};
