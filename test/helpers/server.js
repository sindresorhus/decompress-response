import http from 'http';
import pify from 'pify';

export const host = 'localhost';
export const port = 6765;

export function createServer(givenPort = port) {
	const s = http.createServer((req, resp) => {
		s.emit(req.url, req, resp);
	});

	s.host = host;
	s.port = givenPort;
	s.url = `http://${host}:${givenPort}`;
	s.protocol = 'http';
	s.listen = pify(s.listen);
	s.close = pify(s.close);

	return s;
}
