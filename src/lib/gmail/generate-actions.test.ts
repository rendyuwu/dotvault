import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const revalidatePathMock = vi.fn();
  const requireUserMock = vi.fn();
  const requireUserForActionMock = vi.fn();
  const getDbMock = vi.fn();

  return {
    getDbMock,
    requireUserForActionMock,
    requireUserMock,
    revalidatePathMock,
  };
});

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
  getGeneratePageAccounts,
  previewGenerateAliasesAction,
  saveGeneratedAliasesAction,
} from "./generate-actions";
import { dotAliases } from "@/lib/db/schema";

const userId = "00000000-0000-4000-8000-000000000001";
const accountId = "00000000-0000-4000-8000-000000000002";

function mockUser() {
  return {
    id: userId,
    email: "admin@example.com",
    displayName: "Admin",
    isActive: true,
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  };
}

function mockAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: accountId,
    userId,
    originalEmail: "a.b.c@gmail.com",
    canonicalEmail: "abc@gmail.com",
    localPart: "abc",
    domain: "gmail.com",
    label: "Personal",
    notes: null,
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

function createSaveDb(options: {
  accountRows?: unknown[];
  insertedRows?: unknown[];
}) {
  const accountBuilder = createSelectBuilder(options.accountRows ?? [mockAccount()]);
  const returningMock = vi.fn().mockResolvedValue(options.insertedRows ?? []);
  const onConflictDoNothingMock = vi.fn(() => ({ returning: returningMock }));
  const valuesMock = vi.fn(() => ({ onConflictDoNothing: onConflictDoNothingMock }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  const tx = {
    select: vi.fn(() => accountBuilder),
    insert: insertMock,
  };
  const transactionMock = vi.fn((callback) => callback(tx));
  const db = {
    transaction: transactionMock,
  };

  return {
    accountBuilder,
    db,
    insertMock,
    onConflictDoNothingMock,
    returningMock,
    transactionMock,
    tx,
    valuesMock,
  };
}

describe("generate actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("lists active accounts with alias counts including archived aliases", async () => {
    const account = mockAccount();
    const { db } = createDbWithSelects([
      [account],
      [{ gmailAccountId: accountId, count: 3 }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(getGeneratePageAccounts()).resolves.toEqual([
      {
        id: accountId,
        label: "Personal",
        originalEmail: "a.b.c@gmail.com",
        canonicalEmail: "abc@gmail.com",
        localPart: "abc",
        domain: "gmail.com",
        aliasCount: 3,
      },
    ]);

    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("skips saved aliases when generating preview", async () => {
    const { db } = createDbWithSelects([
      [mockAccount()],
      [{ localPartWithDots: "abc" }, { localPartWithDots: "a.bc" }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(
      previewGenerateAliasesAction({ gmailAccountId: accountId, count: 10 })
    ).resolves.toEqual({
      ok: true,
      aliases: [
        {
          localPartWithDots: "ab.c",
          aliasEmail: "ab.c@gmail.com",
          dotCount: 1,
        },
        {
          localPartWithDots: "a.b.c",
          aliasEmail: "a.b.c@gmail.com",
          dotCount: 2,
        },
      ],
      stats: {
        totalPossible: 4,
        alreadySaved: 2,
        remaining: 2,
        requested: 10,
        generated: 2,
        shortage: true,
      },
    });
  });

  it("counts archived aliases as saved for preview stats and skipping", async () => {
    const { db } = createDbWithSelects([
      [mockAccount()],
      [
        { localPartWithDots: "abc" },
        { localPartWithDots: "a.bc" },
        { localPartWithDots: "ab.c" },
      ],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await previewGenerateAliasesAction({
      gmailAccountId: accountId,
      count: 5,
    });

    expect(result).toEqual({
      ok: true,
      aliases: [
        {
          localPartWithDots: "a.b.c",
          aliasEmail: "a.b.c@gmail.com",
          dotCount: 2,
        },
      ],
      stats: {
        totalPossible: 4,
        alreadySaved: 3,
        remaining: 1,
        requested: 5,
        generated: 1,
        shortage: true,
      },
    });
  });

  it("returns legal preview aliases in generator order", async () => {
    const { db } = createDbWithSelects([
      [mockAccount({ localPart: "abcd", canonicalEmail: "abcd@gmail.com" })],
      [{ localPartWithDots: "abcd" }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await previewGenerateAliasesAction({
      gmailAccountId: accountId,
      count: 4,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        aliases: [
          {
            localPartWithDots: "a.bcd",
            aliasEmail: "a.bcd@gmail.com",
            dotCount: 1,
          },
          {
            localPartWithDots: "ab.cd",
            aliasEmail: "ab.cd@gmail.com",
            dotCount: 1,
          },
          {
            localPartWithDots: "abc.d",
            aliasEmail: "abc.d@gmail.com",
            dotCount: 1,
          },
          {
            localPartWithDots: "a.b.cd",
            aliasEmail: "a.b.cd@gmail.com",
            dotCount: 2,
          },
        ],
      })
    );

    if (result.ok) {
      for (const alias of result.aliases) {
        expect(alias.localPartWithDots).not.toMatch(/^\.|\.$|\.\./);
      }
    }
  });

  it("computes max variations and shortage stats", async () => {
    const { db } = createDbWithSelects([
      [mockAccount({ localPart: "abcde", canonicalEmail: "abcde@gmail.com" })],
      Array.from({ length: 15 }, (_, index) => ({
        localPartWithDots: `saved-${index}`,
      })),
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await previewGenerateAliasesAction({
      gmailAccountId: accountId,
      count: 5,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        stats: {
          totalPossible: 16,
          alreadySaved: 15,
          remaining: 1,
          requested: 5,
          generated: 1,
          shortage: true,
        },
      })
    );
  });

  it("returns shortage stats instead of validation error for requests above generation cap", async () => {
    const { db } = createDbWithSelects([
      [mockAccount({ localPart: "abcde", canonicalEmail: "abcde@gmail.com" })],
      [{ localPartWithDots: "abcde" }],
    ]);
    mocks.getDbMock.mockReturnValue(db);

    const result = await previewGenerateAliasesAction({
      gmailAccountId: accountId,
      count: 501,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        aliases: expect.arrayContaining([
          {
            localPartWithDots: "a.bcde",
            aliasEmail: "a.bcde@gmail.com",
            dotCount: 1,
          },
        ]),
        stats: {
          totalPossible: 16,
          alreadySaved: 1,
          remaining: 15,
          requested: 501,
          generated: 15,
          shortage: true,
        },
      })
    );
  });

  it("rejects preview for accounts outside authenticated scope", async () => {
    const { db } = createDbWithSelects([[]]);
    mocks.getDbMock.mockReturnValue(db);

    await expect(
      previewGenerateAliasesAction({ gmailAccountId: accountId, count: 1 })
    ).resolves.toEqual({ ok: false, error: "Gmail account not found" });

    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it("rechecks account ownership before saving aliases", async () => {
    const db = createSaveDb({ accountRows: [] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).resolves.toEqual({ ok: false, error: "Gmail account not found" });

    expect(db.insertMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated save requests before DB access", async () => {
    mocks.requireUserForActionMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).rejects.toThrow("Unauthorized");

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("rejects invalid preview aliases before insert", async () => {
    const db = createSaveDb({ accountRows: [mockAccount()] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "x.yz",
            aliasEmail: "x.yz@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).resolves.toEqual({ ok: false, error: "Invalid preview aliases" });

    expect(db.insertMock).not.toHaveBeenCalled();
  });

  it("rejects preview aliases with mismatched email or dot count before insert", async () => {
    const db = createSaveDb({ accountRows: [mockAccount()] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "ab.c@gmail.com",
            dotCount: 2,
          },
        ],
      })
    ).resolves.toEqual({ ok: false, error: "Invalid preview aliases" });

    expect(db.insertMock).not.toHaveBeenCalled();
  });

  it("rejects archived accounts before saving aliases", async () => {
    const db = createSaveDb({ accountRows: [] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).resolves.toEqual({ ok: false, error: "Gmail account not found" });

    expect(db.insertMock).not.toHaveBeenCalled();
  });

  it("saves unique aliases and counts conflicts as skipped", async () => {
    const db = createSaveDb({
      accountRows: [mockAccount()],
      insertedRows: [{ id: "alias-1" }],
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
          {
            localPartWithDots: "ab.c",
            aliasEmail: "ab.c@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).resolves.toEqual({ ok: true, saved: 1, skipped: 1 });

    expect(db.valuesMock).toHaveBeenCalledWith([
      {
        userId,
        gmailAccountId: accountId,
        aliasEmail: "a.bc@gmail.com",
        localPartWithDots: "a.bc",
        dotCount: 1,
        isOriginal: false,
        notes: null,
        archived: false,
      },
      {
        userId,
        gmailAccountId: accountId,
        aliasEmail: "ab.c@gmail.com",
        localPartWithDots: "ab.c",
        dotCount: 1,
        isOriginal: false,
        notes: null,
        archived: false,
      },
    ]);
    expect(db.onConflictDoNothingMock).toHaveBeenCalledWith({
      target: [dotAliases.userId, dotAliases.aliasEmail],
    });
  });

  it("deduplicates duplicate preview inputs and counts them as skipped", async () => {
    const db = createSaveDb({
      accountRows: [mockAccount()],
      insertedRows: [{ id: "alias-1" }],
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      saveGeneratedAliasesAction({
        gmailAccountId: accountId,
        aliases: [
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
          {
            localPartWithDots: "a.bc",
            aliasEmail: "a.bc@gmail.com",
            dotCount: 1,
          },
        ],
      })
    ).resolves.toEqual({ ok: true, saved: 1, skipped: 1 });

    expect(db.valuesMock).toHaveBeenCalledWith([
      {
        userId,
        gmailAccountId: accountId,
        aliasEmail: "a.bc@gmail.com",
        localPartWithDots: "a.bc",
        dotCount: 1,
        isOriginal: false,
        notes: null,
        archived: false,
      },
    ]);
  });

  it("revalidates affected pages after save", async () => {
    const db = createSaveDb({
      accountRows: [mockAccount()],
      insertedRows: [{ id: "alias-1" }],
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await saveGeneratedAliasesAction({
      gmailAccountId: accountId,
      aliases: [
        {
          localPartWithDots: "a.bc",
          aliasEmail: "a.bc@gmail.com",
          dotCount: 1,
        },
      ],
    });

    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/generate");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/gmail-accounts");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/aliases");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });
});
