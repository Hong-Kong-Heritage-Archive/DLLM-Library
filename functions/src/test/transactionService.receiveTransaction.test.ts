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

describe("TransactionService.receiveTransaction", () => {
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

  const mockReceiver: User = {
    id: "receiver-1",
    email: "receiver@example.com",
    nickname: "Receiver",
    location: {
      latitude: 40.7128,
      longitude: -74.006,
    } as Location,
  } as User;

  const otherReceiver: User = {
    ...mockReceiver,
    id: "other-receiver-1",
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
      updateItemHolder: jest.fn().mockResolvedValue(true),
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
      if (userId === mockReceiver.id) return Promise.resolve(mockReceiver);
      if (userId === otherReceiver.id) return Promise.resolve(otherReceiver);
      return Promise.resolve(null);
    });

    service = new TransactionService(mockItemService, mockUserService);

    // Mock the _transactionsNotStatus to return 0 transactions
    const transactionsMap = new Map();
    jest
      .spyOn(service as any, "_transactionsNotStatus")
      .mockResolvedValue(transactionsMap);
  });

  it("receives a transaction successfully", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      receiverId: mockReceiver.id,
      status: TransactionStatus.Transfered,
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

    const result = await (service as any).receiveTransaction(
      mockReceiver,
      "txn-1",
      []
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("txn-1");
    expect(result.status).toBe(TransactionStatus.Completed);
    expect(mockItemService.itemById).toHaveBeenCalledWith(null, "item-1", true);
    expect(mockItemService.updateItemHolder).toHaveBeenCalledWith("item-1", mockReceiver);
    expect(sendNotificationViaEmail).toHaveBeenCalled();
  });

  it("throws error when transaction is not in transfered status", async () => {
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

    mockItemService.itemById.mockResolvedValue(mockItem);

    await expect(
      (service as any).receiveTransaction(
        mockReceiver,
        "txn-1",
        []
      )
    ).rejects.toThrow("Transaction with id txn-1 is not in transfered status, current status: APPROVED");
  });

  it("throws error when receiver is not the requestor for non-FaceToFace transaction", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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

    mockItemService.itemById.mockResolvedValue(mockItem);


    await expect(
      (service as any).receiveTransaction(
        otherReceiver,
        "txn-1",
        []
      )
    ).rejects.toThrow("User with id other-receiver-1 is not the receiver of transaction with id txn-1");
  });

  it("properly updates item holder to requestor", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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

    const result = await (service as any).receiveTransaction(
      mockRequestor,
      "txn-1",
      []
    );

    expect(result.status).toBe(TransactionStatus.Completed);
    expect(mockItemService.updateItemHolder).toHaveBeenCalledWith("item-1", mockRequestor);
  });

  it("handles GS images correctly", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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

    // Mock GetPublicUrlForGSFile to return a public URL
    platformMock.GetPublicUrlForGSFile.mockResolvedValue("https://example.com/image1.jpg");

    // Mock the item service to return the item
    mockItemService.itemById.mockResolvedValue(mockItem);

    const result = await (service as any).receiveTransaction(
      mockRequestor,
      "txn-1",
      ["gs://bucket/image1.jpg"]
    );

    expect(result.status).toBe(TransactionStatus.Completed);
    expect(mockItemService.updateItemHolder).toHaveBeenCalledWith("item-1", mockRequestor);
  });

  it("handles public images correctly", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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

    const result = await (service as any).receiveTransaction(
      mockRequestor,
      "txn-1",
      ["https://example.com/image1.jpg"]
    );

    expect(result.status).toBe(TransactionStatus.Completed);
    expect(mockItemService.updateItemHolder).toHaveBeenCalledWith("item-1", mockRequestor);
  });

  it("throws error when item is not found", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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
      (service as any).receiveTransaction(
        mockRequestor,
        "txn-1",
        []
      )
    ).rejects.toThrow("Item with id item-1 not found");
  });

  it("throws error when item holder update fails", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      requestorId: mockRequestor.id,
      status: TransactionStatus.Transfered,
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

    mockItemService.itemById.mockResolvedValue(mockItem);
    mockItemService.updateItemHolder.mockResolvedValue(false);

    await expect(
      (service as any).receiveTransaction(
        mockRequestor,
        "txn-1",
        []
      )
    ).rejects.toThrow("Failed to update item holder for item with id item-1");
  });
});