import {expectType} from 'tsd-check';
import decompressResponse from '.';
import * as http from 'http';

http.get('localhost', response => {
	expectType<http.IncomingMessage>(decompressResponse(response));
});
