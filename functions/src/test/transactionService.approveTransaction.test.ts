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
jest.mock("../platform", () => {
  const docMock = jest.fn();
  docMock.mockReturnValue({
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    update: jest.fn().mockResolvedValue(undefined),
  });

  const collectionMock = jest.fn();
  collectionMock.mockReturnValue({
    add: jest.fn().mockResolvedValue({ id: "txn-1" }),
    doc: docMock,
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  });

  return {
    sendNotificationViaEmail: jest.fn().mockResolvedValue(undefined),
    db: {
      collection: collectionMock,
    },
    GetPublicUrlForGSFile: jest.fn(),
  };
});

import { sendNotificationViaEmail } from "../platform";

// Get access to mocked platform module
const platformMock = jest.requireMock("../platform");

describe("TransactionService.approveTransaction", () => {
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

  it("approves a transaction successfully", async () => {
  // Mock the transaction data
  const mockTransactionData: any = {
    id: "txn-1",
    itemId: "item-1",
    requestorId: mockRequestor.id,
    status: TransactionStatus.Pending,
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

  // Call the approveTransaction method
  const result = await service.approveTransaction(mockOwner, "txn-1");

  // Assertions
  expect(result).toBeDefined();
  expect(result.id).toBe("txn-1");
  expect(result.status).toBe(TransactionStatus.Approved);
  expect(result.requestor.id).toBe(mockRequestor.id);
  expect(result.item.id).toBe(mockItem.id);

  // Verify email notification was sent
  expect(sendNotificationViaEmail).toHaveBeenCalledWith(
    expect.arrayContaining([mockRequestor.email, mockOwner.email]),
    [],
    `Transaction Approved for Item: ${mockItem.name}`,
    expect.stringContaining(`Your transaction request for item ${mockItem.name} has been approved by ${mockOwner.nickname}. Please proceed with the next steps.`),
    expect.stringContaining("transaction/txn-1")
  );
});

it("throws error when trying to approve a non-pending transaction", async () => {
  // Mock the transaction data with a different status
  const mockTransactionData: any = {
    id: "txn-1",
    itemId: "item-1",
    status: TransactionStatus.Completed, // Not pending
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

  // Call the approveTransaction method and expect an error
  await expect(service.approveTransaction(mockOwner, "txn-1"))
    .rejects
    .toThrow(`Transaction with id txn-1 is not in pending status, current status: ${TransactionStatus.Completed}`);
});

it("throws error when trying to approve a transaction for a non-owned item", async () => {
  // Mock the transaction data
  const mockTransactionData: any = {
    id: "txn-1",
    itemId: "item-1",
    status: TransactionStatus.Pending,
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

  // Mock the item service to return a different item (not owned by mockOwner)
  const mockDifferentItem: Item = {
    id: "item-1",
    name: "Different Item",
    ownerId: "different-owner-id",
    holderId: mockHolder.id,
    contentRating: 1,
  } as Item;

  mockItemService.itemById.mockResolvedValue(mockDifferentItem);

  // Call the approveTransaction method and expect an error
  await expect(service.approveTransaction(mockOwner, "txn-1"))
    .rejects
    .toThrow(`Owner with id ${mockOwner.id} is not the owner of item with id item-1`);
});

  it("throws error when item is not found", async () => {
    // Mock the transaction data
    const mockTransactionData: any = {
      id: "txn-1",
      itemId: "item-1",
      status: TransactionStatus.Pending,
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

    // Mock the item service to return null (item not found)
    mockItemService.itemById.mockResolvedValue(null);

    // Call the approveTransaction method and expect an error
    await expect(service.approveTransaction(mockOwner, "txn-1"))
      .rejects
      .toThrow(`Item with id item-1 not found`);
  });
});
