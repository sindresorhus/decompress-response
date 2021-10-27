import http from 'node:http';
import {expectType} from 'tsd';
import decompressResponse, {UncompressedIncomingMessage} from './index.js';

http.get('localhost', response => {
	expectType<UncompressedIncomingMessage>(decompressResponse(response));
});
