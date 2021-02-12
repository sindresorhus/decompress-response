/// <reference types="node"/>
import {IncomingMessage, IncomingHttpHeaders} from 'http';

declare namespace decompressResponse {
	interface UncompressedIncomingHttpHeaders extends IncomingHttpHeaders {
		'content-encoding'?: never;
	}

	interface UncompressedIncomingMessage extends IncomingMessage {
		headers: UncompressedIncomingHttpHeaders;
	}
}

/**
Decompress a HTTP response if needed.

@param response - The HTTP incoming stream with compressed data.
@returns The decompressed HTTP response stream.

@example
```
import {http} from 'http';
import decompressResponse = require('decompress-response');

http.get('https://sindresorhus.com', response => {
	response = decompressResponse(response);
});
```
*/
declare function decompressResponse(response: IncomingMessage): decompressResponse.UncompressedIncomingMessage;

export = decompressResponse;
