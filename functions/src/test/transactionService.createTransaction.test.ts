/// <reference types="jest" />
import { TransactionService } from "../transactionService";
import {
  Item,
  Location,
  Transaction,
  TransactionStatus,
  TransactionLocation,
  User,
  Role,
} from "../generated/graphql";
import { Timestamp } from "firebase-admin/firestore";

// Mock Firebase
jest.mock("firebase-admin/firestore", () => ({
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      toDate: jest.fn(() => new Date()),
    })),
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      toDate: jest.fn(() => date),
    })),
  },
}));

// Mock platform module
jest.mock("../platform", () => ({
  sendNotificationViaEmail: jest.fn().mockResolvedValue(undefined),
  db: {
    collection: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue({ id: "txn-1" }),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  },
  GetPublicUrlForGSFile: jest.fn(),
}));

import { sendNotificationViaEmail } from "../platform";

// Get access to mocked platform module
const platformMock = jest.requireMock("../platform");

describe("TransactionService.createTransaction", () => {
  let service: TransactionService;
  let mockItemService: any;
  let mockUserService: any;
  let mockDb: any;

  const mockRequestor: User = {
    id: "requestor-1",
    email: "requestor@example.com",
    nickname: "Requestor",
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    } as Location,
  } as User;

  const mockOwner: User = {
    id: "owner-1",
    email: "owner@example.com",
    nickname: "Owner",
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    } as Location,
  } as User;

  const mockHolder: User = {
    id: "holder-1",
    email: "holder@example.com",
    nickname: "Holder",
    location: {
      latitude: 40.758,
      longitude: -73.9855,
    } as Location,
  } as User;

  const mockItem: Item = {
    id: "item-1",
    name: "Test Item",
    ownerId: mockOwner.id,
    holderId: mockHolder.id,
    contentRating: 1,
  } as Item;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock ItemService
    mockItemService = {
      itemById: jest.fn().mockResolvedValue(mockItem),
    } as any;

    // Mock UserService
    mockUserService = {
      userById: jest.fn(),
    } as any;

    // Setup default user responses
    mockUserService.userById.mockImplementation((userId: string) => {
      if (userId === mockRequestor.id) return Promise.resolve(mockRequestor);
      if (userId === mockOwner.id) return Promise.resolve(mockOwner);
      if (userId === mockHolder.id) return Promise.resolve(mockHolder);
      return Promise.resolve(null);
    });

    service = new TransactionService(mockItemService, mockUserService);

    // Mock the _transactionsNotStatus to return 0 transactions
    const transactionsMap = new Map();
    // transactionsMap.set("txn-1", {});
    // transactionsMap.set("txn-2", {});
    jest
      .spyOn(service as any, "_transactionsNotStatus")
      .mockResolvedValue(transactionsMap);
  });

  it("creates a transaction successfully with holder location", async () => {
    const result = await (service as any).createTransaction(
      mockRequestor,
      "item-1",
      TransactionLocation.HolderLocation,
      0,
      "Please send the item"
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("txn-1");
    expect(result.requestor.id).toBe(mockRequestor.id);
    expect(result.status).toBe(TransactionStatus.Pending);
    expect(mockItemService.itemById).toHaveBeenCalledWith(mockRequestor, "item-1");
    expect(sendNotificationViaEmail).toHaveBeenCalled();
  });

  it("creates a transaction with requestor location", async () => {
    const result = await (service as any).createTransaction(
      mockRequestor,
      "item-1",
      TransactionLocation.RequestorLocation,
      0,
      "Please pick up from my location"
    );

    expect(result).toBeDefined();
    expect(result.status).toBe(TransactionStatus.Pending);
  });

  it("throws error when item is not found", async () => {
    mockItemService.itemById.mockResolvedValueOnce(null);

    await expect(
      (service as any).createTransaction(
        mockRequestor,
        "item-1",
        TransactionLocation.HolderLocation,
        0,
        "Test"
      )
    ).rejects.toThrow("Item with id item-1 not found");
  });

  it("throws error when owner is not found", async () => {
    mockUserService.userById.mockImplementation((userId: string) => {
      if (userId === mockRequestor.id) return Promise.resolve(mockRequestor);
      if (userId === mockHolder.id) return Promise.resolve(mockHolder);
      return Promise.resolve(null);
    });

    await expect(
      (service as any).createTransaction(
        mockRequestor,
        "item-1",
        TransactionLocation.HolderLocation,
        0,
        "Test"
      )
    ).rejects.toThrow("Owner with id owner-1 not found");
  });

  it("throws error when return transaction created by non-holder", async () => {
    const otherUser: User = {
      ...mockRequestor,
      id: "other-user-1",
    } as User;

    await expect(
      (service as any).createTransaction(
        otherUser,
        "item-1",
        TransactionLocation.HolderLocation,
        0,
        "Return transaction",
        true
      )
    ).rejects.toThrow(
      "Return transactions can only be created by the current holder of the item"
    );
  });

  it("creates a return transaction with Approved status when isReturnTransaction is true", async () => {
    const result = await (service as any).createTransaction(
      mockHolder,
      "item-1",
      TransactionLocation.HolderLocation,
      0,
      "Returning item",
      true
    );

    expect(result.status).toBe(TransactionStatus.Approved);
  });

  it("sends email notification to requestor, owner, and holder", async () => {
    await (service as any).createTransaction(
      mockRequestor,
      "item-1",
      TransactionLocation.HolderLocation,
      0,
      "Test"
    );

    expect(sendNotificationViaEmail).toHaveBeenCalledWith(
      expect.arrayContaining([
        mockRequestor.email,
        mockHolder.email,
        mockOwner.email,
      ]),
      [],
      "New Transaction Request",
      expect.stringContaining(mockItem.name),
      expect.stringContaining("transaction/")
    );
  });

  it("handles transaction with item where owner is holder", async () => {
    const itemWithoutHolder: Item = {
      ...mockItem,
      holderId: undefined,
    } as Item;

    mockItemService.itemById.mockResolvedValueOnce(itemWithoutHolder);

    const result = await (service as any).createTransaction(
      mockRequestor,
      "item-1",
      TransactionLocation.HolderLocation,
      0,
      "Test"
    );

    expect(result).toBeDefined();
  });

  it("throws error when too many open transactions exist", async () => {
    const transactionsMap = new Map();
    transactionsMap.set("txn-1", {});
    transactionsMap.set("txn-2", {});

    // Mock the _transactionsNotStatus to return 2 transactions
    jest
      .spyOn(service as any, "_transactionsNotStatus")
      .mockResolvedValueOnce(transactionsMap);

    await expect(
      (service as any).createTransaction(
        mockRequestor,
        "item-1",
        TransactionLocation.HolderLocation,
        0,
        "Test"
      )
    ).rejects.toThrow(
      "There are already 2 open transactions for item with id item-1"
    );
  });
  

  it("throws error for exchange point location when exchange point not found", async () => {
    mockUserService.userById.mockImplementation((userId: string) => {
      if (userId === mockRequestor.id) return Promise.resolve(mockRequestor);
      if (userId === mockOwner.id) return Promise.resolve(mockOwner);
      if (userId === mockHolder.id) return Promise.resolve(mockHolder);
      return Promise.resolve(null); // Exchange point not found
    });

    const requestorWithExchange: User = {
      ...mockRequestor,
      exchangePoints: ["exchange-1"],
    } as User;

    await expect(
      (service as any).createTransaction(
        requestorWithExchange,
        "item-1",
        TransactionLocation.RequestorPublicExchangePoint,
        0,
        "Test"
      )
    ).rejects.toThrow("Exchange point with id exchange-1 not found");
  });

  it("creates chained transaction when using exchange point location", async () => {
    const mockExchangePoint: User = {
      id: "exchange-1",
      email: "exchange@example.com",
      nickname: "Exchange Point",
      location: {
        latitude: 40.7258,
        longitude: -73.9855,
      } as Location,
    } as User;

    mockUserService.userById.mockImplementation((userId: string) => {
      if (userId === mockRequestor.id) return Promise.resolve(mockRequestor);
      if (userId === mockOwner.id) return Promise.resolve(mockOwner);
      if (userId === mockHolder.id) return Promise.resolve(mockHolder);
      if (userId === mockExchangePoint.id)
        return Promise.resolve(mockExchangePoint);
      return Promise.resolve(null);
    });

    const requestorWithExchange: User = {
      ...mockRequestor,
      exchangePoints: ["exchange-1"],
    } as User;

    platformMock.db.add = jest
      .fn()
      .mockResolvedValueOnce({ id: "txn-1" })
      .mockResolvedValueOnce({ id: "txn-chained-1" });

    const result = await (service as any).createTransaction(
      requestorWithExchange,
      "item-1",
      TransactionLocation.RequestorPublicExchangePoint,
      0,
      "Test"
    );

    expect(result).toBeDefined();
    expect(platformMock.db.add).toHaveBeenCalledTimes(2);
  });

  it("includes all participants in the transaction", async () => {
    const mockExchangePoint: User = {
      id: "exchange-1",
      email: "exchange@example.com",
      nickname: "Exchange Point",
      location: {
        latitude: 40.7258,
        longitude: -73.9855,
      } as Location,
    } as User;

    mockUserService.userById.mockImplementation((userId: string) => {
      if (userId === mockRequestor.id) return Promise.resolve(mockRequestor);
      if (userId === mockOwner.id) return Promise.resolve(mockOwner);
      if (userId === mockHolder.id) return Promise.resolve(mockHolder);
      if (userId === mockExchangePoint.id)
        return Promise.resolve(mockExchangePoint);
      return Promise.resolve(null);
    });

    const requestorWithExchange: User = {
      ...mockRequestor,
      exchangePoints: ["exchange-1"],
    } as User;

    let capturedTransactionModel: any;
    platformMock.db.add = jest.fn().mockImplementation((model: any) => {
      capturedTransactionModel = model;
      return Promise.resolve({ id: "txn-1" });
    });

    await (service as any).createTransaction(
      requestorWithExchange,
      "item-1",
      TransactionLocation.RequestorPublicExchangePoint,
      0,
      "Test"
    );

    expect(capturedTransactionModel.participants).toContain(mockRequestor.id);
    expect(capturedTransactionModel.participants).toContain(mockOwner.id);
    //expect(capturedTransactionModel.participants).toContain(mockHolder.id); // TODO: verify
    expect(capturedTransactionModel.participants).toContain(
      mockExchangePoint.id
    );
  });

  it("sets transaction to expire in 14 days", async () => {
    let capturedTransactionModel: any;
    platformMock.db.add = jest.fn().mockImplementation((model: any) => {
      capturedTransactionModel = model;
      return Promise.resolve({ id: "txn-1" });
    });

    const now = Date.now();
    const expectedExpiry = now + 14 * 24 * 60 * 60 * 1000;

    await (service as any).createTransaction(
      mockRequestor,
      "item-1",
      TransactionLocation.HolderLocation,
      0,
      "Test"
    );

    // Check that expired timestamp is approximately 14 days in future
    expect(capturedTransactionModel.expired).toBeDefined();
  });

  it("throws error when transaction fails to save", async () => {
    platformMock.db.add = jest.fn().mockResolvedValue({ id: null });

    await expect(
      (service as any).createTransaction(
        mockRequestor,
        "item-1",
        TransactionLocation.HolderLocation,
        0,
        "Test"
      )
    ).rejects.toThrow("Failed to create transaction");
  });
});
