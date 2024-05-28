import {Transform as TransformStream, PassThrough as PassThroughStream} from 'node:stream';
import zlib from 'node:zlib';
import mimicResponse from 'mimic-response';

export default function decompressResponse(response) {
	const contentEncoding = (response.headers['content-encoding'] || '').toLowerCase();

	if (!['gzip', 'deflate', 'br'].includes(contentEncoding)) {
		return response;
	}

	let isEmpty = true;
	let finalStream = new PassThroughStream();

	// Clone headers to avoid modifying the original response headers
	const headers = {...response.headers};

	function handleContentEncoding(data) {
		const decompressStream = contentEncoding === 'br'
			? zlib.createBrotliDecompress()
			: ((contentEncoding === 'deflate' && data.length > 0 && (data[0] & 0x08) === 0) // eslint-disable-line no-bitwise
				? zlib.createInflateRaw()
				: zlib.createUnzip());

		decompressStream.once('error', error => {
			if (isEmpty && !response.readable) {
				finalStream.end();
				return;
			}

			finalStream.destroy(error);
		});

		checker.pipe(decompressStream).pipe(finalStream);
	}

	const checker = new TransformStream({
		transform(data, _encoding, callback) {
			if (isEmpty === false) {
				callback(null, data);
				return;
			}

			isEmpty = false;

			handleContentEncoding(data);

			callback(null, data);
		},

		flush(callback) {
			callback();
		},
	});

	finalStream = new PassThroughStream({
		autoDestroy: false,
		destroy(error, callback) {
			response.destroy();

			callback(error);
		},
	});

	delete headers['content-encoding'];
	delete headers['content-length'];
	finalStream.headers = headers;

	mimicResponse(response, finalStream);
	response.pipe(checker);

	return finalStream;
}
