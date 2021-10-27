import {Transform as TransformStream, PassThrough as PassThroughStream} from 'node:stream';
import zlib from 'node:zlib';
import mimicResponse from 'mimic-response';

export default function decompressResponse(response) {
	const contentEncoding = (response.headers['content-encoding'] || '').toLowerCase();

	if (!['gzip', 'deflate', 'br'].includes(contentEncoding)) {
		return response;
	}

	delete response.headers['content-encoding'];

	let isEmpty = true;

	const checker = new TransformStream({
		transform(data, _encoding, callback) {
			isEmpty = false;

			callback(null, data);
		},

		flush(callback) {
			callback();
		},
	});

	const finalStream = new PassThroughStream({
		autoDestroy: false,
		destroy(error, callback) {
			response.destroy();

			callback(error);
		},
	});

	const decompressStream = contentEncoding === 'br' ? zlib.createBrotliDecompress() : zlib.createUnzip();

	decompressStream.once('error', error => {
		if (isEmpty && !response.readable) {
			finalStream.end();
			return;
		}

		finalStream.destroy(error);
	});

	mimicResponse(response, finalStream);
	response.pipe(checker).pipe(decompressStream).pipe(finalStream);

	return finalStream;
}
