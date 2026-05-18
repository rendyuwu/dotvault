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
  getAliasDetail,
  getAliases,
  getArchivedAliasCount,
  updateAliasAction,
} from "./actions";

const userId = "00000000-0000-4000-8000-000000000001";
const accountId = "00000000-0000-4000-8000-000000000002";
const aliasId = "00000000-0000-4000-8000-000000000003";
const providerId = "00000000-0000-4000-8000-000000000004";

function mockUser() {
  return { id: userId, email: "admin@example.com" };
}

function alias(overrides: Record<string, unknown> = {}) {
  return {
    id: aliasId,
    userId,
    gmailAccountId: accountId,
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
    builders,
    db: {
      select: vi.fn(() => {
        const builder = builders.shift();
        if (!builder) throw new Error("Unexpected select");
        return builder;
      }),
    },
  };
}

function createUpdateDb(result: unknown[]) {
  const returning = vi.fn().mockResolvedValue(result);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  return { db: { update: vi.fn(() => ({ set })) }, returning, set, where };
}

describe("alias actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("lists aliases with account labels and active provider link counts", async () => {
    const aliasRow = alias();
    const { db } = createDbWithSelects([
      [{ alias: aliasRow, accountLabel: "Personal" }],
      [{ aliasId, count: 2 }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getAliases({ search: "A.B", gmailAccountId: accountId })).resolves.toEqual([
      { ...aliasRow, accountLabel: "Personal", linkCount: 2 },
    ]);

    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("counts archived aliases separately from filtered list results", async () => {
    const { db } = createDbWithSelects([[{ count: 4 }]]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getArchivedAliasCount()).resolves.toBe(4);
  });

  it("returns alias detail with multiple linked providers", async () => {
    const aliasRow = alias();
    const firstLink = link();
    const secondLink = link({
      id: "00000000-0000-4000-8000-000000000006",
      providerId: "00000000-0000-4000-8000-000000000007",
    });
    const { db } = createDbWithSelects([
      [
        {
          alias: aliasRow,
          account: {
            id: accountId,
            label: "Personal",
            originalEmail: "a.b@gmail.com",
            canonicalEmail: "ab@gmail.com",
          },
        },
      ],
      [
        { link: firstLink, provider: provider() },
        { link: secondLink, provider: provider({ id: secondLink.providerId }) },
      ],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await getAliasDetail(aliasId);

    expect(result?.links).toHaveLength(2);
    expect(result?.links[0]).toEqual({ ...firstLink, provider: provider() });
  });

  it("trims and persists alias notes while scoping update to user", async () => {
    const { db, set } = createUpdateDb([{ id: aliasId }]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(updateAliasAction({ id: aliasId, notes: "  note  " })).resolves.toEqual({});

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ notes: "note" })
    );
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/aliases");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith(`/aliases/${aliasId}`);
  });

  it("returns not found when alias update touches no rows", async () => {
    const { db } = createUpdateDb([]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(updateAliasAction({ id: aliasId, archived: true })).resolves.toEqual({
      error: "Alias not found",
    });
  });
});
