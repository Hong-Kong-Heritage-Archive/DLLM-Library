/// <reference types="jest" />
import type { ItemService } from "../itemService";
import type { TransactionService as TransactionServiceType } from "../transactionService";
import type { UserService } from "../userService";
import type { Item, User } from "../generated/graphql";

jest.mock("../platform", () => ({
  db: { collection: jest.fn() },
  GetPublicUrlForGSFile: jest.fn(),
  UploadBufferToGCS: jest.fn(),
  UploadJsonToGCS: jest.fn(),
  googleMapsApiKey: "",
  sendNotificationViaEmail: jest.fn(),
}));

const { db, GetPublicUrlForGSFile, sendNotificationViaEmail } = require("../platform") as typeof import("../platform");
const { TransactionService } = require("../transactionService") as typeof import("../transactionService");

const mockCollection = db.collection as jest.Mock;
const mockAdd = jest.fn();
const mockTransactionsCollection = { add: mockAdd };

describe("TransactionService.confirmReturn", () => {
  let service: TransactionServiceType;
  let itemService: {
    itemById: jest.Mock;
    updateItemHolder: jest.Mock;
  };
  let userService: {
    userById: jest.Mock;
  };

  const owner = {
    id: "owner-1",
    nickname: "Owner",
    email: "owner@example.com",
    location: { latitude: 22.3, longitude: 114.2 },
  } as User;
  const holder = {
    id: "holder-1",
    email: "holder@example.com",
  } as User;
  const loanedItem = {
    id: "item-1",
    name: "Test item",
    ownerId: owner.id,
    holderId: holder.id,
  } as Item;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue({ id: "return-transaction-1" });
    mockCollection.mockImplementation((name: string) => {
      if (name === "transactions") return mockTransactionsCollection;
      throw new Error(`Unexpected collection: ${name}`);
    });
    (GetPublicUrlForGSFile as jest.Mock).mockResolvedValue(
      "https://storage.example.com/condition.jpg",
    );

    itemService = {
      itemById: jest.fn(),
      updateItemHolder: jest.fn(),
    };
    userService = {
      userById: jest.fn().mockResolvedValue(holder),
    };
    service = new TransactionService(
      itemService as unknown as ItemService,
      userService as unknown as UserService,
    );
  });

  it("returns the updated item and records the previous holder", async () => {
    const returnedItem = { ...loanedItem, holderId: null } as Item;
    itemService.itemById
      .mockResolvedValueOnce(loanedItem)
      .mockResolvedValueOnce(returnedItem);
    itemService.updateItemHolder.mockResolvedValue(true);

    const result = await service.confirmReturn(owner, loanedItem.id, [], "Returned at the library");

    expect(itemService.updateItemHolder).toHaveBeenCalledWith(
      loanedItem.id,
      owner,
    );
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        requestorId: holder.id,
        receiverId: owner.id,
        details: "Returned at the library",
      }),
    );
    expect(result).toMatchObject({
      item: returnedItem,
      requestor: holder,
      receiver: owner,
      details: "Returned at the library",
    });
  });

  it("uses the default return detail when none is supplied", async () => {
    itemService.itemById
      .mockResolvedValueOnce(loanedItem)
      .mockResolvedValueOnce({ ...loanedItem, holderId: null });
    itemService.updateItemHolder.mockResolvedValue(true);

    const result = await service.confirmReturn(owner, loanedItem.id, []);

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ details: "RETURNED" }),
    );
    expect(result.details).toBe("RETURNED");
  });

  it("stores condition images and notifies both participants", async () => {
    itemService.itemById
      .mockResolvedValueOnce(loanedItem)
      .mockResolvedValueOnce({ ...loanedItem, holderId: null });
    itemService.updateItemHolder.mockResolvedValue(true);

    const result = await service.confirmReturn(owner, loanedItem.id, [
      "gs://bucket/condition.jpg",
      "https://example.com/second.jpg",
    ]);

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          "https://storage.example.com/condition.jpg",
          "https://example.com/second.jpg",
        ],
        gsImageUrls: ["gs://bucket/condition.jpg"],
      }),
    );
    expect(result.images).toEqual([
      "https://storage.example.com/condition.jpg",
      "https://example.com/second.jpg",
    ]);
    expect(sendNotificationViaEmail).toHaveBeenCalledWith(
      [owner.email, holder.email],
      [],
      expect.stringContaining("Item Returned"),
      expect.any(String),
      expect.stringContaining("transaction/return-transaction-1"),
    );
  });

  it("rejects an item that is not currently lent out", async () => {
    itemService.itemById.mockResolvedValue({
      ...loanedItem,
      holderId: null,
    });

    await expect(service.confirmReturn(owner, loanedItem.id, [])).rejects.toThrow(
      "is not currently lent out",
    );

    expect(itemService.updateItemHolder).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
  });
});
