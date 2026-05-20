import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirectMock = vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  });
  const revalidatePathMock = vi.fn();
  const requireUserMock = vi.fn();
  const requireUserForActionMock = vi.fn();
  const transactionMock = vi.fn();
  const getDbMock = vi.fn();

  return {
    getDbMock,
    redirectMock,
    requireUserForActionMock,
    requireUserMock,
    revalidatePathMock,
    transactionMock,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirectMock,
}));

vi.mock("@/lib/auth/server", () => ({
  requireUser: mocks.requireUserMock,
  requireUserForAction: mocks.requireUserForActionMock,
}));

vi.mock("@/lib/db/client", () => ({
  getDb: mocks.getDbMock,
}));

import {
  createGmailAccountAction,
  getGmailAccounts,
  updateGmailAccountAction,
} from "./accounts-actions";

function createForm(email: string, label = "Personal", notes = "") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("label", label);
  formData.set("notes", notes);
  return formData;
}

function mockUser() {
  return {
    id: "user-1",
    email: "admin@example.com",
    displayName: "Admin",
    isActive: true,
    createdAt: "2026-05-17T00:00:00.000Z",
    updatedAt: "2026-05-17T00:00:00.000Z",
  };
}

type MockDbOptions = {
  accountInsertResult?: unknown[];
  aliasInsertRejects?: boolean;
  listAccounts?: unknown[];
  aliasCounts?: unknown[];
  updateResult?: unknown[];
};

function createMockDb(options: MockDbOptions = {}) {
  const accountValuesMock = vi.fn(() => ({
    onConflictDoNothing: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue(options.accountInsertResult ?? []),
    })),
  }));
  const aliasValuesMock = vi.fn(() => {
    if (options.aliasInsertRejects) {
      return Promise.reject(new Error("alias insert failed"));
    }
    return Promise.resolve();
  });
  const insertMock = vi
    .fn()
    .mockReturnValueOnce({ values: accountValuesMock })
    .mockReturnValueOnce({ values: aliasValuesMock });

  const accountSelectBuilder = {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn().mockResolvedValue(options.listAccounts ?? []),
      })),
    })),
  };
  const aliasCountSelectBuilder = {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        groupBy: vi.fn().mockResolvedValue(options.aliasCounts ?? []),
      })),
    })),
  };
  const selectMock = vi
    .fn()
    .mockReturnValueOnce(accountSelectBuilder)
    .mockReturnValueOnce(aliasCountSelectBuilder);

  const updateSetMock = vi.fn(() => ({
    where: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue(options.updateResult ?? []),
    })),
  }));
  const updateMock = vi.fn(() => ({ set: updateSetMock }));

  const tx = { insert: insertMock };
  const db = {
    transaction: mocks.transactionMock.mockImplementation((callback) => callback(tx)),
    select: selectMock,
    update: updateMock,
  };

  return {
    accountValuesMock,
    aliasValuesMock,
    db,
    insertMock,
    selectMock,
    tx,
    updateMock,
    updateSetMock,
  };
}

describe("gmail account actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUserMock.mockResolvedValue(mockUser());
    mocks.requireUserForActionMock.mockResolvedValue(mockUser());
  });

  it("rejects non-gmail domains without opening a transaction", async () => {
    createMockDb();

    await expect(
      createGmailAccountAction({}, createForm("user@example.com"))
    ).resolves.toEqual({ error: "Only @gmail.com addresses are supported" });

    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated account creation before DB access", async () => {
    mocks.requireUserForActionMock.mockRejectedValue(new Error("Unauthorized"));

    await expect(
      createGmailAccountAction({}, createForm("ren.di@gmail.com"))
    ).rejects.toThrow("Unauthorized");

    expect(mocks.getDbMock).not.toHaveBeenCalled();
  });

  it("rejects plus addressing without opening a transaction", async () => {
    createMockDb();

    await expect(
      createGmailAccountAction({}, createForm("ren+test@gmail.com"))
    ).resolves.toEqual({ error: "Plus-addressing is not supported" });

    expect(mocks.transactionMock).not.toHaveBeenCalled();
  });

  it("trims, lowercases, removes dots, and creates original alias", async () => {
    const db = createMockDb({
      accountInsertResult: [
        {
          id: "account-1",
          userId: "user-1",
          originalEmail: "ren.di.wijaya@gmail.com",
          canonicalEmail: "rendiwijaya@gmail.com",
          localPart: "rendiwijaya",
          domain: "gmail.com",
          label: "Personal",
          notes: null,
          archived: false,
          createdAt: "2026-05-17T00:00:00.000Z",
          updatedAt: "2026-05-17T00:00:00.000Z",
        },
      ],
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      createGmailAccountAction(
        {},
        createForm(" Ren.Di.Wijaya@GMAIL.COM ", " Personal ", "")
      )
    ).rejects.toThrow("NEXT_REDIRECT:/gmail-accounts");

    expect(db.accountValuesMock).toHaveBeenCalledWith({
      userId: "user-1",
      originalEmail: "ren.di.wijaya@gmail.com",
      canonicalEmail: "rendiwijaya@gmail.com",
      localPart: "rendiwijaya",
      domain: "gmail.com",
      label: "Personal",
      notes: null,
    });
    expect(db.aliasValuesMock).toHaveBeenCalledWith({
      userId: "user-1",
      gmailAccountId: "account-1",
      aliasEmail: "rendiwijaya@gmail.com",
      localPartWithDots: "rendiwijaya",
      dotCount: 0,
      isOriginal: true,
      notes: null,
      archived: false,
    });
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/gmail-accounts");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects duplicate canonical accounts from insert conflict", async () => {
    const db = createMockDb({ accountInsertResult: [] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      createGmailAccountAction({}, createForm("ren.di@gmail.com"))
    ).resolves.toEqual({ error: "This Gmail account already exists" });

    expect(db.aliasValuesMock).not.toHaveBeenCalled();
  });

  it("rejects when original alias insert fails inside transaction", async () => {
    const db = createMockDb({
      accountInsertResult: [{ id: "account-1" }],
      aliasInsertRejects: true,
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      createGmailAccountAction({}, createForm("ren.di@gmail.com"))
    ).rejects.toThrow("alias insert failed");

    expect(mocks.transactionMock).toHaveBeenCalledTimes(1);
  });

  it("lists accounts scoped to the authenticated user with alias counts", async () => {
    const account = {
      id: "account-1",
      userId: "user-1",
      originalEmail: "ren.di@gmail.com",
      canonicalEmail: "rendi@gmail.com",
      localPart: "rendi",
      domain: "gmail.com",
      label: "Personal",
      notes: null,
      archived: false,
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:00:00.000Z",
    };
    const db = createMockDb({
      listAccounts: [account],
      aliasCounts: [{ gmailAccountId: "account-1", count: 1 }],
    });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(getGmailAccounts()).resolves.toEqual([
      { ...account, aliasCount: 1 },
    ]);

    expect(mocks.requireUserMock).toHaveBeenCalledTimes(1);
    expect(db.selectMock).toHaveBeenCalledTimes(2);
  });

  it("patches only allowed fields and scopes update to authenticated user", async () => {
    const db = createMockDb({ updateResult: [{ id: "account-1" }] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      updateGmailAccountAction({
        id: "00000000-0000-4000-8000-000000000001",
        label: "   ",
        notes: "  note  ",
        archived: true,
      })
    ).resolves.toEqual({});

    expect(db.updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Untitled",
        notes: "note",
        archived: true,
      })
    );
    const updatePayload = db.updateSetMock.mock.calls.at(0)?.at(0);
    expect(updatePayload).not.toHaveProperty("canonicalEmail");
    expect(updatePayload).not.toHaveProperty("userId");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/gmail-accounts");
    expect(mocks.revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("returns not found when scoped patch updates no rows", async () => {
    const db = createMockDb({ updateResult: [] });
    mocks.getDbMock.mockReturnValue(db.db);

    await expect(
      updateGmailAccountAction({
        id: "00000000-0000-4000-8000-000000000001",
        archived: true,
      })
    ).resolves.toEqual({ error: "Gmail account not found" });
  });
});
