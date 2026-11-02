class BodyTooLargeError extends Error {}

export function isBodyTooLarge(error: unknown): boolean {
  return error instanceof BodyTooLargeError;
}

// Bound actual bytes before JSON or multipart parsing, including chunked requests.
export function limitedBody(request: Request, maxBytes: number): Response {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new BodyTooLargeError();
  let bytes = 0;
  const body = request.body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength;
        if (bytes > maxBytes) throw new BodyTooLargeError();
        controller.enqueue(chunk);
      },
    }),
  );
  return new Response(body, { headers: request.headers });
}
