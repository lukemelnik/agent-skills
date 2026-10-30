# Go HTTP Service Pitfalls

## Routing

Go 1.22+ `http.ServeMux` supports `"GET /users/{id}"` and `r.PathValue("id")`; prefer it over adding a router for simple services.

## Handlers

- Return immediately after `http.Error` or any helper that writes an error response.
- Set headers before `WriteHeader` or the first body write.
- Bound untrusted bodies with `http.MaxBytesReader`; use `io.ReadAll` only on bounded input.
- Do not keep `ResponseWriter` or `*http.Request` beyond handler lifetime.
- Do not leak internal error text to clients; map domain errors at the boundary.

## Contexts

- Use `r.Context()` for request-scoped work; do not pass it to work that must outlive the response. Derive a separate context with its own timeout (`context.WithoutCancel`, 1.21+, only when intentional).
- Client calls: `http.NewRequestWithContext`.

## Timeouts

Construct `http.Server` explicitly with `ReadHeaderTimeout` at minimum (plus `ReadTimeout`/`WriteTimeout`/`IdleTimeout`). A blanket `WriteTimeout` breaks streaming/long-lived responses.

## Clients

- Never `http.DefaultClient` in production; set `Timeout`. Reuse clients/transports.
- Close `resp.Body` on every response, including non-2xx; check status before decoding.
- Bound response reads from untrusted peers.

## Middleware

Call next exactly once or write a terminal response. Be careful wrapping `ResponseWriter`: optional interfaces (`Flusher`, `Hijacker`) are lost unless implemented.

## Shutdown

`Server.Shutdown` with a bounded context; also stop background workers, tickers, and DB resources the process owns.

## Security

`crypto/rand` for tokens; deliberate cookie attributes (`HttpOnly`, `Secure`, `SameSite`); never log credentials, tokens, or cookies.
