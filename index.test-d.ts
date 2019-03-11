import * as http from 'http';
import {expectType} from 'tsd-check';
import decompressResponse from '.';

http.get('localhost', response => {
	expectType<http.IncomingMessage>(decompressResponse(response));
});
