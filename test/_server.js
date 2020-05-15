import http from 'http';
import pify from 'pify';

export const host = 'localhost';
export const port = 6765;

export function createServer(givenPort = port) {
	const server = http.createServer((request, response) => {
		server.emit(request.url, request, response);
	});

	server.host = host;
	server.port = givenPort;
	server.url = `http://${host}:${givenPort}`;
	server.protocol = 'http';
	server.listen = pify(server.listen);
	server.close = pify(server.close);

	return server;
}
