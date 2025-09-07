import { Timestamp } from "firebase-admin/firestore";
import { db, sendNotificationViaEmail } from "./platform";
import {
  Item,
  Transaction,
  TransactionStatus,
  User,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { it } from "node:test";

type TransactionModel = Omit<
  Transaction,
  "id" | "requestor" | "item" | "createdAt" | "updatedAt"
> & {
  requestorId: string;
  itemId: string;
  created: Timestamp;
  updated: Timestamp;
};

type EmailDetail = {
  subject: string;
  body: string;
};
export class TransactionService {
  // Placeholder for transaction service methods
  // Implement methods like createTransaction, approveTransaction, etc.
  constructor(
    private itemService: ItemService,
    private userService: UserService // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async transactionById(id: string): Promise<Transaction | null> {
    const data = await this._transactionById(id);
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    const requestor = await this.userService.userById(data.requestorId);
    return {
      id: id,
      item: item,
      requestor: requestor,
      status: data.status,
      createdAt: data.created.seconds * 1000,
      updatedAt: data.updated.seconds * 1000,
    };
  }

  async _transactionById(id: string): Promise<TransactionModel> {
    const transactionDoc = await db.collection("transactions").doc(id).get();
    if (!transactionDoc.exists || !transactionDoc.data()) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    const data = transactionDoc.data() as TransactionModel;
    return data;
  }

  async transactionsNotStatus(
    itemId: string | null,
    userId: string | null,
    statuses: TransactionStatus[]
  ): Promise<Transaction[]> {
    const transactionsMap = await this._transactionsNotStatus(
      itemId,
      null,
      statuses
    );
    const transactions: Transaction[] = [];
    for (const [id, data] of transactionsMap) {
      const item = await this.itemService.itemById(data.itemId);
      if (item && data.requestorId) {
        const requestor = await this.userService.userById(data.requestorId);
        transactions.push({
          id: id,
          item: item,
          requestor: requestor,
          status: data.status,
          createdAt: data.created.seconds * 1000,
          updatedAt: data.updated.seconds * 1000,
        });
      }
    }
    return transactions;
  }

  async _transactionsNotStatus(
    itemId: string | null,
    userId: string | null,
    statuses: TransactionStatus[]
  ): Promise<Map<string, TransactionModel>> {
    let query = db.collection("transactions").orderBy("updated", "desc");
    if (itemId) {
      query = query.where("itemId", "==", itemId);
    }
    if (userId) {
      query = query.where("requestorId", "==", userId);
    }
    if (statuses.length > 0) {
      query = query.where("status", "not-in", statuses);
    }
    const transactionDocs = await query.get();
    const transactions: Map<string, TransactionModel> = new Map();
    for (const doc of transactionDocs.docs) {
      const data = doc.data() as TransactionModel;
      transactions.set(doc.id, data);
    }
    return transactions;
  }

  async createTransaction(
    requestor: User,
    itemId: string
  ): Promise<Transaction> {
    // Logic to create a transaction
    const item = await this.itemService.itemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }
    const userToNotify = item.holderId ? item.holderId : item.ownerId;
    if (!userToNotify) {
      throw new Error(`No user to notify for item with id ${itemId}`);
    }
    const requestorId = requestor.id;
    // check if there is 2 open transactions for the item
    const existingTransactions = await this._transactionsNotStatus(
      itemId,
      null,
      [TransactionStatus.Completed, TransactionStatus.Cancelled]
    );
    if (existingTransactions.size >= 2) {
      throw new Error(
        `There are already 2 open transactions for item with id ${itemId}`
      );
    }
    const transactionModel: TransactionModel = {
      requestorId: requestorId,
      itemId: itemId,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      status: TransactionStatus.Pending,
    };
    // Save transaction to the database
    const transactionRef = await db
      .collection("transactions")
      .add(transactionModel);
    if (!transactionRef.id) {
      throw new Error("Failed to create transaction");
    }

    // Notify the user
    let toList = [requestor.email];
    let ccList: string[] = [];
    const owner = await this.userService.userById(item.ownerId);
    if (owner) {
      toList.push(owner.email);
    }
    if (item.holderId) {
      const holder = await this.userService.userById(item.holderId);
      if (holder) {
        toList.push(holder.email);
      }
    }
    sendNotificationViaEmail(
      toList,
      ccList,
      "New Transaction Request",
      `You have a new transaction request for item ${item.name} from ${requestor.nickname}.`
    );
    let rv: Transaction = {
      id: transactionRef.id,
      item: item,
      requestor: requestor,
      status: transactionModel.status,
      createdAt: transactionModel.created.seconds * 1000,
      updatedAt: transactionModel.updated.seconds * 1000,
    };
    return rv;
  }

  async approveTransaction(owner: User, id: string): Promise<Transaction> {
    const data = await this._transactionById(id);
    // Logic to approve a transaction
    if (data.status !== TransactionStatus.Pending) {
      throw new Error(
        `Transaction with id ${id} is not in pending status, current status: ${data.status}`
      );
    }
    // if the item is not owned by the owner, throw an error
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    if (item.ownerId !== owner.id) {
      throw new Error(
        `Owner with id ${owner.id} is not the owner of item with id ${data.itemId}`
      );
    }

    const emailDetail: EmailDetail = {
      subject: `Transaction Approved for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been approved by ${owner.nickname}. Please proceed with the next steps.`,
    };
    const rv = await this._updateTransaction(
      id,
      TransactionStatus.Approved,
      owner,
      item,
      data,
      emailDetail
    );
    return rv;
  }

  async cancelTransaction(user: User, id: string): Promise<boolean> {
    const data = await this._transactionById(id);
    // Logic to approve a transaction
    if (
      data.status == TransactionStatus.Completed ||
      data.status == TransactionStatus.Cancelled
    ) {
      throw new Error(
        `Transaction with id ${id} is not in open status, current status: ${data.status}`
      );
    }
    // either owner and requestor can cancel the transaction
    // if the item is not owned by the owner, throw an error
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }

    if (data.requestorId !== user.id && item.ownerId !== user.id) {
      throw new Error(
        `User with id ${user.id} is not the requestor or owner of item with id ${data.itemId}`
      );
    }

    let owner: User = user;
    if (item.ownerId !== user.id) {
      let ownerRv = await this.userService.userById(item.ownerId);
      if (!ownerRv) {
        throw new Error(`Owner with id ${item.ownerId} not found`);
      }
      owner = ownerRv;
    }

    const emailDetail: EmailDetail = {
      subject: `Transaction Cancelled for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been cancelled by ${user.nickname}.`,
    };
    const rv = await this._updateTransaction(
      id,
      TransactionStatus.Cancelled,
      owner,
      item,
      data,
      emailDetail
    );
    if (!rv) {
      throw new Error(`Failed to cancel transaction with id ${id}`);
    }
    return true;
  }

  async _updateTransaction(
    id: string,
    status: TransactionStatus,
    owner: User,
    item: Item,
    data: TransactionModel,
    emailDetail: EmailDetail
  ): Promise<Transaction> {
    // Save the updated transaction to the database

    const requestor = await this.userService.userById(data.requestorId);
    if (!requestor) {
      throw new Error(`Requestor with id ${data.requestorId} not found`);
    }

    const updated = Timestamp.now();
    await db.collection("transactions").doc(id).update({ status, updated });
    // Logic to approve a transaction
    // Notify the requestor
    let toList = [requestor.email, owner.email];
    let ccList: string[] = [];
    if (item.holderId) {
      const holder = await this.userService.userById(item.holderId);
      if (holder) {
        toList.push(holder.email);
      }
    }
    sendNotificationViaEmail(
      toList,
      ccList,
      emailDetail.subject,
      emailDetail.body
    );
    let rv: Transaction = {
      id: id,
      item: item,
      requestor: requestor,
      ...data,
      status: status,
      createdAt: data.created.seconds * 1000,
      updatedAt: updated.seconds * 1000,
    };
    return rv;
  }

  async transferTransaction(user: User, id: string): Promise<Transaction> {
    // Logic to transfer a transaction
    // Check if the item is Approved by owner
    const data = await this._transactionById(id);
    if (data.status !== TransactionStatus.Approved) {
      throw new Error(
        `Transaction with id ${id} is not in approved status, current status: ${data.status}`
      );
    }
    // check if the item is holder by owner, confirm that the user is the owner or holder
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    const holderId = item.holderId ? item.holderId : item.ownerId;
    if (holderId !== user.id) {
      throw new Error(
        `User with id ${user.id} is not the holder or owner of item with id ${data.itemId}`
      );
    }
    let owner: User = user;
    if (item.ownerId !== user.id) {
      let ownerRv = await this.userService.userById(item.ownerId);
      if (!ownerRv) {
        throw new Error(`Owner with id ${item.ownerId} not found`);
      }
      owner = ownerRv;
    }

    const emailDetail: EmailDetail = {
      subject: `Transaction Transferred for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been transferred by ${user.nickname}.`,
    };
    const rv = await this._updateTransaction(
      id,
      TransactionStatus.Transfered,
      owner,
      item,
      data,
      emailDetail
    );
    if (!rv) {
      throw new Error(`Failed to transfer transaction with id ${id}`);
    }
    return rv;
  }

  async receiveTransaction(requestor: User, id: string): Promise<Transaction> {
    // Logic to receive a transaction
    const data = await this._transactionById(id);
    if (data.status !== TransactionStatus.Transfered) {
      throw new Error(
        `Transaction with id ${id} is not in transfered status, current status: ${data.status}`
      );
    }
    // only the requestor can receive the transaction
    if (data.requestorId !== requestor.id) {
      throw new Error(
        `User with id ${requestor.id} is not the requestor of transaction with id ${id}`
      );
    }

    // update the item holder to the requestor
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    if (item.holderId && item.holderId !== requestor.id) {
      throw new Error(
        `Item with id ${data.itemId} is already held by another user`
      );
    }
    const updated = await this.itemService.updateItemHolder(item.id, requestor);
    if (!updated) {
      throw new Error(
        `Failed to update item holder for item with id ${item.id}`
      );
    }
    const emailDetail: EmailDetail = {
      subject: `Transaction Received for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been received.`,
    };
    let owner: User = requestor;
    if (item.ownerId !== requestor.id) {
      let ownerRv = await this.userService.userById(item.ownerId);
      if (!ownerRv) {
        throw new Error(`Owner with id ${item.ownerId} not found`);
      }
      owner = ownerRv;
    }
    const rv = await this._updateTransaction(
      id,
      TransactionStatus.Completed,
      owner,
      item,
      data,
      emailDetail
    );
    if (!rv) {
      throw new Error(`Failed to complete transaction with id ${id}`);
    }
    return rv;
  }
}
