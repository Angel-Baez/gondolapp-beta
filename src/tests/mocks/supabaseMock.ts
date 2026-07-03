import { vi } from "vitest";

export interface MockResponse {
  data?: any;
  error?: any;
}

/**
 * Objeto encadenable que imita al query builder de supabase-js: cualquier
 * método (select/eq/in/order/insert/...) devuelve el mismo objeto, y el
 * `await` final se resuelve con la respuesta configurada vía la trampa `then`.
 */
export function chainable(response: MockResponse) {
  const resolved = Promise.resolve({
    data: response.data ?? null,
    error: response.error ?? null,
  });

  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") return resolved.then.bind(resolved);
      if (prop === "catch") return resolved.catch.bind(resolved);
      if (prop === "finally") return resolved.finally.bind(resolved);
      return (..._args: unknown[]) => proxy;
    },
  };

  const proxy = new Proxy(() => {}, handler) as any;
  return proxy;
}

/**
 * Crea un mock de `supabase.from` que devuelve, en orden, un query builder
 * encadenable por cada llamada esperada. El código bajo prueba debe llamar
 * a `.from()` exactamente en ese orden (una vez por cada operación real que
 * hace: un select, un insert, un delete, etc).
 */
export function mockSupabaseFrom(...responses: MockResponse[]) {
  const fromMock = vi.fn();
  responses.forEach((response) => {
    fromMock.mockReturnValueOnce(chainable(response));
  });
  return fromMock;
}
