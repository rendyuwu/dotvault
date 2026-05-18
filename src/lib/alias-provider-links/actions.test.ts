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
  createAliasProviderLinkAction,
  getAliasProviderLinkOptions,
  updateAliasProviderLinkAction,
} from "./actions";

const userId = "00000000-0000-4000-8000-000000000001";
const aliasId = "00000000-0000-4000-8000-000000000002";
const providerId = "00000000-0000-4000-8000-000000000003";
const linkId = "00000000-0000-4000-8000-000000000004";

function mockUser() {
  return { id: userId, email: "admin@example.com" };
}

function link(overrides: Record<string, unknown> = {}) {
  return {
    id: linkId,
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

function createCreateDb(existing: unknown[]) {
  const aliasBuilder = createSelectBuilder([{ id: aliasId }]);
  const providerBuilder = createSelectBuilder([{ id: providerId }]);
  const existingBuilder = createSelectBuilder(existing);
  const returning = vi.fn().mockResolvedValue([link()]);
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  const tx = {
    select: vi
      .fn()
      .mockReturnValueOnce(aliasBuilder)
      .mockReturnValueOnce(providerBuilder)
      .mockReturnValueOnce(existingBuilder),
    insert,
  };
  return {
    db: { transaction: vi.fn((callback) => callback(tx)) },
    insert,
    tx,
    values,
  };
}

function createRestoreDb(existing: unknown[]) {
  const aliasBuilder = createSelectBuilder([{ id: aliasId }]);
  const providerBuilder = createSelectBuilder([{ id: providerId }]);
  const existingBuilder = createSelectBuilder(existing);
  const returning = vi.fn().mockResolvedValue([
    link({ archived: false, accountIdentifier: "restored", notes: "new" }),
  ]);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const tx = {
    select: vi
      .fn()
      .mockReturnValueOnce(aliasBuilder)
      .mockReturnValueOnce(providerBuilder)
      .mockReturnValueOnce(existingBuilder),
    update: vi.fn(() => ({ set })),
  };
  return { db: { transaction: vi.fn((callback) => callback(tx)) }, set, tx };
}

function createUpdateDb(existing: unknown[], updated: unknown[]) {
  const existingBuilder = createSelectBuilder(existing);
  const returning = vi.fn().mockResolvedValue(updated);
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  return {
    db: {
      select: vi.fn(() => existingBuilder),
      update: vi.fn(() => ({ set })),
    },
    set,
  };
}

function createRejectingTransactionDb(error: unknown) {
  return {
    transaction: vi.fn().mockRejectedValue(error),
  };
}

describe("alias provider link actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("returns active aliases/providers plus all existing links for modal duplicate detection", async () => {
    const { db } = createDbWithSelects([
      [
        {
          id: aliasId,
          gmailAccountId: "acct-1",
          aliasEmail: "a.b@gmail.com",
          archived: false,
          accountLabel: "Personal",
        },
      ],
      [{ id: providerId, name: "GitHub", category: "Dev", archived: false }],
      [{ id: linkId, aliasId, providerId, archived: true }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getAliasProviderLinkOptions()).resolves.toEqual({
      aliases: [
        {
          id: aliasId,
          gmailAccountId: "acct-1",
          aliasEmail: "a.b@gmail.com",
          archived: false,
          accountLabel: "Personal",
        },
      ],
      providers: [{ id: providerId, name: "GitHub", category: "Dev", archived: false }],
      existingLinks: [{ id: linkId, aliasId, providerId, archived: true }],
    });
  });

  it("creates new links with account identifier and notes", async () => {
    const { db, values } = createCreateDb([]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(
      createAliasProviderLinkAction({
        aliasId,
        providerId,
        accountIdentifier: "  rendi  ",
        notes: "  primary  ",
      })
    ).resolves.toEqual({ link: link() });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        aliasId,
        providerId,
        accountIdentifier: "rendi",
        notes: "primary",
      })
    );
  });

  it("rejects duplicate active links", async () => {
    const { db } = createCreateDb([link()]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(createAliasProviderLinkAction({ aliasId, providerId })).resolves.toEqual({
      error: "This alias is already linked to this provider",
    });
  });

  it("rejects invalid link identifiers before DB access", async () => {
    await expect(
      createAliasProviderLinkAction({ aliasId: "bad-id", providerId })
    ).resolves.toEqual({ error: expect.any(String) });

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("maps link unique constraint races to duplicate errors", async () => {
    const db = createRejectingTransactionDb({
      code: "23505",
      constraint_name: "alias_provider_links_user_alias_provider_unique",
    });
    mocks.getDbMock.mockReturnValue(db);

    await expect(createAliasProviderLinkAction({ aliasId, providerId })).resolves.toEqual({
      error: "This alias is already linked to this provider",
    });
  });

  it("rejects unauthenticated link creation before DB access", async () => {
    mocks.requireUserForActionMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(createAliasProviderLinkAction({ aliasId, providerId })).rejects.toThrow(
      "Unauthorized"
    );

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("restores archived duplicate links and updates metadata", async () => {
    const { db, set } = createRestoreDb([link({ archived: true })]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await createAliasProviderLinkAction({
      aliasId,
      providerId,
      accountIdentifier: "restored",
      notes: "new",
    });

    expect(result.link).toEqual(
      expect.objectContaining({ archived: false, accountIdentifier: "restored", notes: "new" })
    );
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ archived: false, accountIdentifier: "restored", notes: "new" })
    );
  });

  it("patches link metadata and archive flag scoped to user", async () => {
    const existing = link();
    const updated = link({ accountIdentifier: null, notes: "updated", archived: true });
    const { db, set } = createUpdateDb([existing], [updated]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(
      updateAliasProviderLinkAction({
        id: linkId,
        accountIdentifier: "   ",
        notes: " updated ",
        archived: true,
      })
    ).resolves.toEqual({ link: updated });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ accountIdentifier: null, notes: "updated", archived: true })
    );
  });

  it("returns not found for out-of-scope link update", async () => {
    const { db } = createUpdateDb([], []);
    mocks.getDbMock.mockReturnValue(db);

    await expect(updateAliasProviderLinkAction({ id: linkId, archived: true })).resolves.toEqual({
      error: "Link not found",
    });
  });
});
