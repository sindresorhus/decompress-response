/// <reference types="node"/>
import {IncomingMessage} from 'http';

/**
 * Decompress a HTTP response if needed.
 *
 * @param response - The HTTP incoming stream with compressed data.
 * @returns The decompressed HTTP response stream.
 */
export default function decompressResponse(response: IncomingMessage): IncomingMessage;
