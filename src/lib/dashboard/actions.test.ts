import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDbMock: vi.fn(),
  requireUserMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: mocks.requireUserMock,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDbMock,
}));

import { getDashboardSummary } from "./actions";

const userId = "00000000-0000-4000-8000-000000000001";

function mockUser() {
  return { id: userId, email: "admin@example.com" };
}

function createSelectBuilder(result: unknown) {
  const promise = Promise.resolve(result);
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(() => promise),
    then: promise.then.bind(promise),
  };
  return builder;
}

function createDbWithSelects(results: unknown[]) {
  const builders = results.map(createSelectBuilder);
  const queue = [...builders];
  return {
    builders,
    db: {
      select: vi.fn(() => {
        const builder = queue.shift();
        if (!builder) throw new Error("Unexpected select");
        return builder;
      }),
    },
  };
}

describe("dashboard actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
  });

  it("requires an authenticated user before DB access", async () => {
    mocks.requireUserMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(getDashboardSummary()).rejects.toThrow("Unauthorized");

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("returns live dashboard summary counts for the current user", async () => {
    const { builders, db } = createDbWithSelects([
      [{ count: 2 }],
      [{ count: 7 }],
      [{ count: 3 }],
      [{ count: 4 }],
      [{ count: 5 }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getDashboardSummary()).resolves.toEqual({
      gmailAccountCount: 2,
      activeAliasCount: 7,
      archivedAliasCount: 3,
      activeProviderCount: 4,
      activeAliasProviderLinkCount: 5,
    });

    expect(db.select).toHaveBeenCalledTimes(5);
    expect(db.select).toHaveBeenNthCalledWith(1, { count: expect.any(Object) });
    expect(db.select).toHaveBeenNthCalledWith(2, { count: expect.any(Object) });
    expect(db.select).toHaveBeenNthCalledWith(3, { count: expect.any(Object) });
    expect(db.select).toHaveBeenNthCalledWith(4, { count: expect.any(Object) });
    expect(db.select).toHaveBeenNthCalledWith(5, { count: expect.any(Object) });
    expect(builders[4]?.innerJoin).toHaveBeenCalledTimes(2);
  });

  it("defaults missing count rows to zero", async () => {
    const { db } = createDbWithSelects([[], [], [], [], []]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getDashboardSummary()).resolves.toEqual({
      gmailAccountCount: 0,
      activeAliasCount: 0,
      archivedAliasCount: 0,
      activeProviderCount: 0,
      activeAliasProviderLinkCount: 0,
    });
  });
});
