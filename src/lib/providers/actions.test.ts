import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  requireUserMock: vi.fn(),
  requireUserForActionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePathMock,
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: mocks.requireUserMock,
  requireUserForAction: mocks.requireUserForActionMock,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDbMock,
}));

import {
  createProviderAction,
  getArchivedProviderCount,
  getProviderDetail,
  getProviders,
  updateProviderAction,
} from "./actions";

const userId = "00000000-0000-4000-8000-000000000001";
const providerId = "00000000-0000-4000-8000-000000000002";
const aliasId = "00000000-0000-4000-8000-000000000003";

function mockUser() {
  return { id: userId, email: "admin@example.com" };
}

function provider(overrides: Record<string, unknown> = {}) {
  return {
    id: providerId,
    userId,
    name: "GitHub",
    website: "github.com",
    category: "Developer Tools",
    notes: null,
    archived: false,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
    ...overrides,
  };
}

function alias(overrides: Record<string, unknown> = {}) {
  return {
    id: aliasId,
    userId,
    gmailAccountId: "00000000-0000-4000-8000-000000000004",
    aliasEmail: "a.b@gmail.com",
    localPartWithDots: "a.b",
    dotCount: 1,
    isOriginal: false,
    notes: null,
    archived: false,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
    ...overrides,
  };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000005",
    userId,
    aliasId,
    providerId,
    accountIdentifier: "rendi",
    notes: "primary",
    archived: false,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
    ...overrides,
  };
}

function createSelectBuilder(result: unknown) {
  const promise = Promise.resolve(result);
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(() => builder),
    orderBy: vi.fn(() => promise),
    groupBy: vi.fn(() => promise),
    limit: vi.fn(() => promise),
    then: promise.then.bind(promise),
  };
  return builder;
}

function createDbWithSelects(results: unknown[]) {
  const builders = results.map(createSelectBuilder);
  return {
    db: {
      select: vi.fn(() => {
        const builder = builders.shift();
        if (!builder) throw new Error("Unexpected select");
        return builder;
      }),
    },
  };
}

function createInsertDb(result: unknown[], precheck: unknown[] = []) {
  const precheckBuilder = createSelectBuilder(precheck);
  const returning = vi.fn().mockResolvedValue(result);
  const values = vi.fn(() => ({ returning }));
  return {
    db: {
      select: vi.fn(() => precheckBuilder),
      insert: vi.fn(() => ({ values })),
    },
    values,
  };
}

function createUpdateDb(result: unknown[], precheck: unknown[] = []) {
  const precheckBuilder = createSelectBuilder(precheck);
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  return {
    db: {
      select: vi.fn(() => precheckBuilder),
      update: vi.fn(() => ({ set })),
    },
    set,
  };
}

describe("provider actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("lists providers with active linked alias counts", async () => {
    const providerRow = provider();
    const { db } = createDbWithSelects([[providerRow], [{ providerId, count: 2 }]]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getProviders()).resolves.toEqual([
      { ...providerRow, linkCount: 2 },
    ]);
  });

  it("counts archived providers separately from filtered list results", async () => {
    const { db } = createDbWithSelects([[{ count: 3 }]]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getArchivedProviderCount()).resolves.toBe(3);
  });

  it("returns provider detail with multiple linked aliases", async () => {
    const providerRow = provider();
    const { db } = createDbWithSelects([
      [providerRow],
      [
        { link: link(), alias: alias(), account: { id: "acct-1", label: "Personal" } },
        {
          link: link({ id: "00000000-0000-4000-8000-000000000006" }),
          alias: alias({ id: "00000000-0000-4000-8000-000000000007" }),
          account: { id: "acct-2", label: "Work" },
        },
      ],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await getProviderDetail(providerId);

    expect(result?.links).toHaveLength(2);
  });

  it("accepts arbitrary free-text category and trims blank fields", async () => {
    const providerRow = provider({ category: "Custom Category", website: null, notes: null });
    const { db, values } = createInsertDb([providerRow]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(
      createProviderAction({
        name: "  GitHub  ",
        website: "   ",
        category: "  Custom Category  ",
        notes: "   ",
      })
    ).resolves.toEqual({ provider: providerRow });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "GitHub",
        website: null,
        category: "Custom Category",
        notes: null,
      })
    );
  });

  it("rejects invalid provider input before DB access", async () => {
    await expect(createProviderAction({ name: "   " })).resolves.toEqual({
      error: "Provider name is required",
    });

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated provider creation before DB access", async () => {
    mocks.requireUserForActionMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(createProviderAction({ name: "GitHub" })).rejects.toThrow("Unauthorized");

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("rejects active provider names case-insensitively before insert", async () => {
    const { db } = createInsertDb([], [{ id: providerId }]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(createProviderAction({ name: "github" })).resolves.toEqual({
      error: 'A provider named "github" already exists',
    });
  });

  it("updates only allowed fields and archives without deleting", async () => {
    const providerRow = provider({ archived: true });
    const { db, set } = createUpdateDb([providerRow]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(updateProviderAction({ id: providerId, archived: true })).resolves.toEqual({
      provider: providerRow,
    });

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ archived: true }));
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/providers");
  });
});
