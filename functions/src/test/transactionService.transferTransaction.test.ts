/// <reference types="jest" />
import { TransactionService } from "../transactionService";
import {
  Item,
  Location,
  Transaction,
  TransactionStatus,
  TransactionLocation,
  User,
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

describe("TransactionService.transferTransaction", () => {
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
    jest
      .spyOn(service as any, "_transactionsNotStatus")
      .mockResolvedValue(transactionsMap);
  });

  it("transfers a transaction successfully", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Approved,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      location: mockHolder.location,
      locationType: TransactionLocation.HolderLocation,
      details: "Test details",
      isReturnTransaction: false,
      participants: [mockRequestor.id, mockOwner.id, mockHolder.id],
    };

    // Mock the db.get to return the transaction data
    const docMock = platformMock.db.collection().doc;
    docMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockTransactionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    });

    // Mock the item service to return the item
    mockItemService.itemById.mockResolvedValue(mockItem);

    const result = await (service as any).transferTransaction(
      mockHolder,
      "txn-1"
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("txn-1");
    expect(result.status).toBe(TransactionStatus.Transfered);
    expect(mockItemService.itemById).toHaveBeenCalledWith(mockHolder, "item-1");
    expect(sendNotificationViaEmail).toHaveBeenCalled();
  });

  it("throws error when item is not found", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Approved,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      location: mockHolder.location,
      locationType: TransactionLocation.HolderLocation,
      details: "Test details",
      isReturnTransaction: false,
      participants: [mockRequestor.id, mockOwner.id, mockHolder.id],
    };

    // Mock the db.get to return the transaction data
    const docMock = platformMock.db.collection().doc;
    docMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockTransactionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    });

    mockItemService.itemById.mockResolvedValueOnce(null);

    await expect(
      (service as any).transferTransaction(
        mockHolder,
        "txn-1",
        ["image1.jpg"]
      )
    ).rejects.toThrow("Item with id item-1 not found");
  });

  it("throws error when holder is not the owner or current holder", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Approved,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      location: mockHolder.location,
      locationType: TransactionLocation.HolderLocation,
      details: "Test details",
      isReturnTransaction: false,
      participants: [mockRequestor.id, mockOwner.id, mockHolder.id],
    };

    // Mock the db.get to return the transaction data
    const docMock = platformMock.db.collection().doc;
    docMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockTransactionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    });

    const otherUser: User = {
      ...mockRequestor,
      id: "other-user-1",
    } as User;

    await expect(
      (service as any).transferTransaction(
        otherUser,
        "txn-1"
      )
    ).rejects.toThrow("User with id other-user-1 is not the holder or owner of item with id item-1");
  });

  it("properly updates transaction status to Transfered", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Approved,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      location: mockHolder.location,
      locationType: TransactionLocation.HolderLocation,
      details: "Test details",
      isReturnTransaction: false,
      participants: [mockRequestor.id, mockOwner.id, mockHolder.id],
    };

    // Mock the db.get to return the transaction data
    const docMock = platformMock.db.collection().doc;
    docMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockTransactionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    });

    // Mock db.collection().add to return transaction with id
    platformMock.db.collection.mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: "txn-1" }),
      doc: docMock,
    });

    const result = await (service as any).transferTransaction(
      mockHolder,
      "txn-1"
    );

    expect(result.status).toBe(TransactionStatus.Transfered);
    expect(sendNotificationViaEmail).toHaveBeenCalled();
  });

  it("throws error when transaction fails to save", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Approved,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      location: mockHolder.location,
      locationType: TransactionLocation.HolderLocation,
      details: "Test details",
      isReturnTransaction: false,
      participants: [mockRequestor.id, mockOwner.id, mockHolder.id],
    };

    // Mock the db.get to return the transaction data
    const docMock = platformMock.db.collection().doc;
    docMock.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockTransactionData,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    });

    // Mock the _updateTransaction to return null (failure)
    jest
      .spyOn(service as any, "_updateTransaction")
      .mockResolvedValue(null);

    await expect(
      (service as any).transferTransaction(
        mockHolder,
        "txn-1"
      )
    ).rejects.toThrow("Failed to transfer transaction with id txn-1");
  });
});