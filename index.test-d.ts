import * as http from 'http';
import {expectType} from 'tsd';
import decompressResponse = require('.');

http.get('localhost', response => {
	expectType<http.IncomingMessage>(decompressResponse(response));
});
