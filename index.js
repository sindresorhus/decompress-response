'use strict';
const {Transform, PassThrough} = require('stream');
const zlib = require('zlib');
const mimicResponse = require('mimic-response');

const supportedCompressionAlgorithms = ['gzip', 'deflate', 'br'];

module.exports = response => {
	const contentEncoding = (response.headers['content-encoding'] || '').toLowerCase();
	delete response.headers['content-encoding'];

	if (!supportedCompressionAlgorithms.includes(contentEncoding)) {
		return response;
	}

	// TODO: Remove this when targeting Node.js 12.
	const isBrotli = contentEncoding === 'br';
	if (isBrotli && typeof zlib.createBrotliDecompress !== 'function') {
		response.destroy(new Error('Brotli is not supported on Node.js < 12'));
		return response;
	}

	let isEmpty = response.readableLength === 0;

	response.once('readable', () => {
		if (response.readableLength === 0) {
			isEmpty = true;
		}
	});

	const finalStream = new PassThrough({
		autoDestroy: false,
		destroy(error, callback) {
			response.destroy();

			callback(error);
		}
	});

	const decompressStream = isBrotli ? zlib.createBrotliDecompress() : zlib.createUnzip();

	decompressStream.once('error', error => {
		if (isEmpty && !response.readable) {
			finalStream.end();
			return;
		}

		finalStream.destroy(error);
	});

	mimicResponse(response, finalStream);
	response.pipe(decompressStream, finalStream);

	return finalStream;
};
