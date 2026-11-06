/// <reference types="jest" />
import type { ItemService } from "../itemService";
import type { TransactionService as TransactionServiceType } from "../transactionService";
import type { UserService } from "../userService";
import type { Item, User } from "../generated/graphql";
import { TransactionStatus } from "../generated/graphql";
import { Timestamp } from "firebase-admin/firestore";

jest.mock("../platform", () => ({
  db: { collection: jest.fn() },
  GetPublicUrlForGSFile: jest.fn(),
  UploadBufferToGCS: jest.fn(),
  UploadJsonToGCS: jest.fn(),
  googleMapsApiKey: "",
  sendNotificationViaEmail: jest.fn(),
}));

const { db, sendNotificationViaEmail } = require("../platform") as typeof import("../platform");
const { TransactionService } = require("../transactionService") as typeof import("../transactionService");

const mockCollection = db.collection as jest.Mock;

describe("TransactionService request queue (issue #278)", () => {
  let service: TransactionServiceType;
  let itemService: {
    itemById: jest.Mock;
    isHolder: jest.Mock;
    updateItemHolder: jest.Mock;
  };
  let userService: {
    userById: jest.Mock;
    userModelById: jest.Mock;
  };

  const owner = {
    id: "owner-1",
    nickname: "Owner",
    email: "owner@example.com",
  } as User;
  const holder = {
    id: "holder-1",
    nickname: "Holder",
    email: "holder@example.com",
  } as User;
  const stranger = {
    id: "stranger-1",
    nickname: "Stranger",
    email: "stranger@example.com",
  } as User;
  const requestorA = {
    id: "req-a",
    nickname: "Alice",
    email: "alice@example.com",
  } as User;
  const requestorB = {
    id: "req-b",
    nickname: "Bob",
    email: "bob@example.com",
  } as User;
  const requestorC = {
    id: "req-c",
    nickname: "Carol",
    email: "carol@example.com",
  } as User;

  const item = {
    id: "item-1",
    name: "Test book",
    ownerId: owner.id,
    holderId: holder.id,
  } as Item;

  const makeTxDoc = (
    id: string,
    requestorId: string,
    status: TransactionStatus,
    updatedSeconds: number,
  ) => ({
    id,
    data: () => ({
      requestorId,
      itemId: item.id,
      participants: [requestorId, owner.id, holder.id],
      status,
      created: Timestamp.fromMillis(updatedSeconds * 1000),
      updated: Timestamp.fromMillis(updatedSeconds * 1000),
    }),
  });

  let transactionDocs: ReturnType<typeof makeTxDoc>[];
  let docStore: Map<string, ReturnType<typeof makeTxDoc>>;

  beforeEach(() => {
    jest.clearAllMocks();

    transactionDocs = [
      makeTxDoc("tx-1", requestorA.id, TransactionStatus.Pending, 300),
      makeTxDoc("tx-2", requestorB.id, TransactionStatus.Pending, 200),
      makeTxDoc("tx-3", requestorC.id, TransactionStatus.Approved, 100),
      makeTxDoc("tx-done", requestorA.id, TransactionStatus.Completed, 400),
    ];
    docStore = new Map(transactionDocs.map((d) => [d.id, d]));

    // Track filters so list queries and parentTransactionId lookups diverge.
    const createQuery = () => {
      const filters: Array<{ field: string; op: string; value: unknown }> = [];
      const query: any = {
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn((field: string, op: string, value: unknown) => {
          filters.push({ field, op, value });
          return query;
        }),
        get: jest.fn(async () => {
          const parentFilter = filters.find(
            (f) => f.field === "parentTransactionId",
          );
          if (parentFilter) {
            // No chained children in these tests
            return { docs: [] };
          }
          const docs = Array.from(docStore.values())
            .filter((d) => {
              const status = d.data().status;
              return (
                status !== TransactionStatus.Completed &&
                status !== TransactionStatus.Cancelled &&
                status !== TransactionStatus.Expired
              );
            })
            .map((d) => ({ id: d.id, data: d.data }));
          return { docs };
        }),
      };
      return query;
    };

    mockCollection.mockImplementation((name: string) => {
      if (name !== "transactions") {
        throw new Error(`Unexpected collection: ${name}`);
      }
      const query = createQuery();
      return {
        orderBy: query.orderBy,
        where: query.where,
        get: query.get,
        doc: (id: string) => ({
          get: async () => {
            const doc = docStore.get(id);
            if (!doc) {
              return { exists: false, data: () => undefined };
            }
            return { exists: true, data: doc.data, id: doc.id };
          },
          update: jest.fn().mockImplementation(async (patch: Record<string, unknown>) => {
            const existing = docStore.get(id);
            if (!existing) return;
            const prev = existing.data();
            docStore.set(id, {
              id,
              data: () => ({ ...prev, ...patch }),
            });
          }),
        }),
      };
    });

    itemService = {
      itemById: jest.fn().mockResolvedValue(item),
      isHolder: jest.fn().mockImplementation((it: Item, u: User) => {
        if (it.holderId) return it.holderId === u.id;
        return it.ownerId === u.id;
      }),
      updateItemHolder: jest.fn(),
    };
    const findUser = async (id: string) => {
      const users = [owner, holder, stranger, requestorA, requestorB, requestorC];
      return users.find((u) => u.id === id) || null;
    };
    userService = {
      userById: jest.fn().mockImplementation(findUser),
      userModelById: jest.fn().mockImplementation(findUser),
    };
    service = new TransactionService(
      itemService as unknown as ItemService,
      userService as unknown as UserService,
    );
  });

  describe("incompleteRequestsByItem", () => {
    it("returns paginated incomplete requests for the owner", async () => {
      const page = await service.incompleteRequestsByItem(owner, item.id, 2, 0);

      expect(page.totalCount).toBe(3);
      expect(page.requests).toHaveLength(2);
      expect(page.requests[0]).toMatchObject({
        id: "tx-1",
        requestorName: "Alice",
        requestorEmail: "alice@example.com",
      });
      expect(page.requests[1]).toMatchObject({
        id: "tx-2",
        requestorName: "Bob",
        requestorEmail: "bob@example.com",
      });
    });

    it("supports offset pagination", async () => {
      const page = await service.incompleteRequestsByItem(owner, item.id, 2, 2);

      expect(page.totalCount).toBe(3);
      expect(page.requests).toHaveLength(1);
      expect(page.requests[0].id).toBe("tx-3");
    });

    it("allows the current holder to view the queue", async () => {
      const page = await service.incompleteRequestsByItem(holder, item.id, 5, 0);
      expect(page.totalCount).toBe(3);
      expect(page.requests).toHaveLength(3);
    });

    it("hides the queue from everyone else", async () => {
      const page = await service.incompleteRequestsByItem(
        stranger,
        item.id,
        5,
        0,
      );
      expect(page).toEqual({ requests: [], totalCount: 0 });
    });
  });

  describe("deleteIncompleteRequest / deleteIncompleteRequests", () => {
    it("lets the owner soft-delete a single incomplete request", async () => {
      const result = await service.deleteIncompleteRequest(owner, "tx-1");
      expect(result).toBe(true);
      expect(sendNotificationViaEmail).toHaveBeenCalled();
      expect(docStore.get("tx-1")!.data().status).toBe(
        TransactionStatus.Cancelled,
      );
    });

    it("rejects delete from non-owner (holder)", async () => {
      await expect(
        service.deleteIncompleteRequest(holder, "tx-1"),
      ).rejects.toThrow(/not the owner/);
    });

    it("batch-deletes multiple incomplete requests for the owner", async () => {
      const result = await service.deleteIncompleteRequests(owner, [
        "tx-1",
        "tx-2",
      ]);
      expect(result).toBe(true);
      expect(docStore.get("tx-1")!.data().status).toBe(
        TransactionStatus.Cancelled,
      );
      expect(docStore.get("tx-2")!.data().status).toBe(
        TransactionStatus.Cancelled,
      );
    });

    it("rejects batch delete when ids are empty", async () => {
      await expect(
        service.deleteIncompleteRequests(owner, []),
      ).rejects.toThrow(/No request ids/);
    });
  });
});
