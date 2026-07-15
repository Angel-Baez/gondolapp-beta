import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Captura los handlers de postgres_changes por tabla para dispararlos a mano.
const handlers: Record<string, () => void> = {};
interface CanalFake {
  on: (ev: string, cfg: { table: string }, cb: () => void) => CanalFake;
  subscribe: () => CanalFake;
}
const canalFake: CanalFake = {
  on: vi.fn((_ev: string, cfg: { table: string }, cb: () => void) => {
    handlers[cfg.table] = cb;
    return canalFake;
  }),
  subscribe: vi.fn(() => canalFake),
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn(() => canalFake),
    removeChannel: vi.fn(),
    realtime: { setAuth: vi.fn() },
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { access_token: "jwt-test" } },
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ tiendaActiva: "tienda-test" }),
}));

import RealtimeProvider from "@/components/RealtimeProvider";
import { useOutboxStore } from "@/store/outbox";

const ITEMS_REPOSICION = ["tienda", "tienda-test", "reposicion", "items"];

function renderProvider(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  Object.keys(handlers).forEach((k) => delete handlers[k]);
  useOutboxStore.setState({ isSyncing: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("RealtimeProvider", () => {
  it("invalida la lista una sola vez tras una ráfaga (debounce)", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderProvider(queryClient);

    // La suscripción espera a getSession() (promesa); dejarla resolver.
    await vi.waitFor(() => expect(handlers.items_reposicion).toBeDefined());

    handlers.items_reposicion();
    handlers.items_reposicion();
    handlers.items_reposicion();
    expect(invalidateSpy).not.toHaveBeenCalled(); // aún en debounce

    await vi.advanceTimersByTimeAsync(400);
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ITEMS_REPOSICION });
  });

  it("suspende la invalidación mientras el outbox sincroniza", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    renderProvider(queryClient);
    await vi.waitFor(() => expect(handlers.items_reposicion).toBeDefined());

    useOutboxStore.setState({ isSyncing: true });
    handlers.items_reposicion();
    await vi.advanceTimersByTimeAsync(400);

    // El outbox invalida ["tienda"] al terminar su corrida; acá no.
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
