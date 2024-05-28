import http, {type IncomingMessage} from 'node:http';
import {expectType} from 'tsd';
import decompressResponse, {type UncompressedIncomingMessage} from './index.js';

http.get('localhost', (response: IncomingMessage) => {
	expectType<UncompressedIncomingMessage>(decompressResponse(response));
});
