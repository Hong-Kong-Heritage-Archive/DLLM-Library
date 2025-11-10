import { Timestamp } from "firebase-admin/firestore";
import {
  db,
  GetPublicUrlForGSFile,
  sendNotificationViaEmail,
} from "./platform";
import {
  Item,
  Transaction,
  TransactionStatus,
  User,
  TransactionLocation,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { it } from "node:test";

type TransactionModel = Omit<
  Transaction,
  | "id"
  | "requestor"
  | "item"
  | "receiver"
  | "createdAt"
  | "updatedAt"
  | "expireAt"
> & {
  requestorId: string;
  receiverId?: string | null;
  itemId: string;
  participants: string[]; // Array containing requestorId, receiverId, holderId and ownerId
  created: Timestamp;
  updated: Timestamp;
  expired?: Timestamp;
  locationType?: TransactionLocation;
  gsImageUrls?: string[];
  gsThumbnailUrls?: string[];
  parentTransactionId?: string | null;
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
    let data = await this._transactionById(id);
    // check if the transaction is open
    if (
      data.status !== TransactionStatus.Completed &&
      data.status !== TransactionStatus.Cancelled &&
      data.status !== TransactionStatus.Expired
    ) {
      if (data.expired && data.expired.toDate() < new Date()) {
        const user = await this.userService.userById(data.requestorId);
        if (!user) {
          throw new Error(`User with id ${data.requestorId} not found`);
        }
        await this._cancelTransaction(user, id, true);
        data.status = TransactionStatus.Expired;
      }
    }

    const rv = await this._transactionModeltoTransaction(id, data);
    return rv;
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
      userId,
      statuses
    );
    const transactions: Transaction[] = [];
    for (const [id, data] of transactionsMap) {
      const transaction = await this._transactionModeltoTransaction(id, data);
      transactions.push(transaction);
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
      query = query.where("participants", "array-contains", userId);
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

  async _transactionModeltoTransaction(
    id: string,
    data: TransactionModel
  ): Promise<Transaction> {
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }
    const requestor = await this.userService.userById(data.requestorId);
    if (!requestor) {
      throw new Error(`Requestor with id ${data.requestorId} not found`);
    }
    let receiver: User | null = null;
    if (data.receiverId) {
      receiver = await this.userService.userById(data.receiverId);
      if (!receiver) {
        throw new Error(`Receiver with id ${data.receiverId} not found`);
      }
    }
    return {
      id: id,
      item: item,
      location: data.location,
      requestor: requestor,
      receiver: receiver,
      status: data.status,
      details: data.details,
      createdAt: data.created.seconds * 1000,
      updatedAt: data.updated.seconds * 1000,
      expireAt: data.expired ? data.expired.seconds * 1000 : undefined,
      images: data.images,
    };
  }

  async createTransaction(
    requestor: User,
    itemId: string,
    locationType: TransactionLocation,
    locationIndex: number,
    details: string
  ): Promise<Transaction> {
    // Logic to create a transaction
    const item = await this.itemService.itemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }
    let toList = [requestor.email];
    let ccList: string[] = [];
    let holder: User | null = null;
    if (item.holderId) {
      holder = await this.userService.userById(item.holderId);
      if (holder) {
        toList.push(holder.email);
      }
    }
    const owner = await this.userService.userById(item.ownerId);
    if (owner) {
      if (holder === null) {
        holder = owner;
      }
      toList.push(owner.email);
    } else {
      throw new Error(`Owner with id ${item.ownerId} not found`);
    }
    let location = holder.location;
    let maxOpenTransactions = 2;
    // for any ExchangePoint location type, we should create chained transactions
    // for from holder to exchange point, then from exchange point to requestor
    let exchangeId: string | null = null;
    switch (locationType) {
      case TransactionLocation.HolderLocation:
        location = holder.location;
        break;
      case TransactionLocation.RequestorLocation:
        location = requestor.location;
        break;
      case TransactionLocation.RequestorPublicExchangePoint:
        maxOpenTransactions++;
        if (
          requestor.exchangePoints &&
          requestor.exchangePoints.length > locationIndex
        ) {
          exchangeId = requestor.exchangePoints[locationIndex];
          const exchangePoint = await this.userService.userById(exchangeId);
          if (exchangePoint) {
            toList.push(exchangePoint.email);
            location = exchangePoint.location;
          } else {
            throw new Error(`Exchange point with id ${exchangeId} not found`);
          }
        }
        break;
      case TransactionLocation.HolderPublicExchangePoint:
        maxOpenTransactions++;
        if (
          holder.exchangePoints &&
          holder.exchangePoints.length > locationIndex
        ) {
          exchangeId = holder.exchangePoints[locationIndex];
          const exchangePoint = await this.userService.userById(exchangeId);
          if (exchangePoint) {
            location = exchangePoint.location;
          } else {
            throw new Error(`Exchange point with id ${exchangeId} not found`);
          }
        }
        break;
    }
    // check if there is 2 open transactions for the item
    const existingTransactions = await this._transactionsNotStatus(
      itemId,
      null,
      [TransactionStatus.Completed, TransactionStatus.Cancelled]
    );

    if (existingTransactions.size >= maxOpenTransactions) {
      throw new Error(
        `There are already ${maxOpenTransactions} open transactions for item with id ${itemId}`
      );
    }
    const participants = [requestor.id, owner.id];
    if (holder) {
      participants.push(holder.id);
    }
    if (exchangeId) {
      participants.push(exchangeId);
    }

    const transactionModel: TransactionModel = {
      requestorId: requestor.id,
      receiverId: exchangeId,
      itemId: itemId,
      participants: [...new Set(participants)], // Remove duplicates
      created: Timestamp.now(),
      updated: Timestamp.now(),
      expired: Timestamp.fromDate(
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      ), // expire in 14 days
      location: location,
      locationType: locationType,
      status: TransactionStatus.Pending,
      details: details,
    };
    // Save transaction to the database
    const transactionRef = await db
      .collection("transactions")
      .add(transactionModel);
    if (!transactionRef.id) {
      throw new Error("Failed to create transaction");
    }

    // for chained transaction, create another transaction from exchange point to requestor
    if (exchangeId) {
      const chainedTransactionModel: TransactionModel = {
        requestorId: requestor.id,
        itemId: itemId,
        created: transactionModel.created,
        updated: transactionModel.updated,
        expired: transactionModel.expired,
        receiverId: requestor.id,
        location: location,
        status: TransactionStatus.Pending,
        participants: [requestor.id, exchangeId, owner.id], // Add participants array
        parentTransactionId: transactionRef.id,
        details: details,
      };
      const chainedTransactionRef = await db
        .collection("transactions")
        .add(chainedTransactionModel);
      if (!chainedTransactionRef.id) {
        throw new Error("Failed to create chained transaction");
      }
    }
    // Notify the user

    sendNotificationViaEmail(
      toList,
      ccList,
      "New Transaction Request",
      `You have a new transaction request for item ${item.name} from ${requestor.nickname}.`,
      "transaction/" + transactionRef.id
    );
    let rv: Transaction = {
      id: transactionRef.id,
      item: item,
      requestor: requestor,
      status: transactionModel.status,
      createdAt: transactionModel.created.seconds * 1000,
      updatedAt: transactionModel.updated.seconds * 1000,
      expireAt: transactionModel.expired
        ? transactionModel.expired.seconds * 1000
        : undefined,
    };
    return rv;
  }

  async createQuickTransaction(
    holder: User,
    itemId: string,
    details: string
  ): Promise<Transaction> {
    // Logic to create a quick transaction
    const item = await this.itemService.itemById(itemId);
    if (!item) {
      throw new Error(`Item with id ${itemId} not found`);
    }
    if (item.holderId !== holder.id && item.ownerId !== holder.id) {
      throw new Error(
        `User with id ${holder.id} is not the holder or owner of item with id ${itemId}`
      );
    }

    const transactionModel: TransactionModel = {
      requestorId: holder.id,
      itemId: itemId,
      created: Timestamp.now(),
      updated: Timestamp.now(),
      locationType: TransactionLocation.FaceToFace,
      expired: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)), // expire in 1 hour,
      status: TransactionStatus.Transfered,
      participants: [holder.id, item.ownerId],
      // You can store details in a suitable field, e.g., as part of images or a new field if needed
      details: details,
    };
    // Save transaction to the database
    const transactionRef = await db
      .collection("transactions")
      .add(transactionModel);
    if (!transactionRef.id) {
      throw new Error("Failed to create quick transaction");
    }

    let rv: Transaction = {
      id: transactionRef.id,
      item: item,
      requestor: holder,
      status: transactionModel.status,
      createdAt: transactionModel.created.seconds * 1000,
      updatedAt: transactionModel.updated.seconds * 1000,
      expireAt: transactionModel.expired
        ? transactionModel.expired.seconds * 1000
        : undefined,
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
    return this._cancelTransaction(user, id, false);
  }

  async _cancelTransaction(
    user: User,
    id: string,
    expired: boolean
  ): Promise<boolean> {
    const data = await this._transactionById(id);
    // Logic to approve a transaction
    if (
      data.status == TransactionStatus.Completed ||
      data.status == TransactionStatus.Cancelled ||
      data.status == TransactionStatus.Expired
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

    if (
      !expired &&
      data.requestorId !== user.id &&
      item.ownerId !== user.id &&
      data.receiverId !== user.id
    ) {
      throw new Error(
        `User with id ${user.id} is not the requestor receiver or owner of item with id ${data.itemId}`
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
    const finalStatus = expired
      ? TransactionStatus.Expired
      : TransactionStatus.Cancelled;

    const emailDetail: EmailDetail = {
      subject: `Transaction Cancelled for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been cancelled by ${user.nickname}.`,
    };
    const rv = await this._updateTransaction(
      id,
      finalStatus,
      owner,
      item,
      data,
      emailDetail
    );
    if (!rv) {
      throw new Error(`Failed to cancel transaction with id ${id}`);
    }
    // remove all chained transactions
    if (rv.id) {
      const chainedTransactions = await db
        .collection("transactions")
        .where("parentTransactionId", "==", rv.id)
        .get();
      for (const doc of chainedTransactions.docs) {
        await this._updateTransaction(
          doc.id,
          finalStatus,
          owner,
          item,
          data,
          null
        );
      }
    }
    return true;
  }

  async _updateTransaction(
    id: string,
    status: TransactionStatus,
    owner: User,
    item: Item,
    data: TransactionModel,
    emailDetail: EmailDetail | null
  ): Promise<Transaction> {
    // Save the updated transaction to the database
    const requestor = await this.userService.userById(data.requestorId);
    if (!requestor) {
      throw new Error(`Requestor with id ${data.requestorId} not found`);
    }
    let receiver: User | null = null;

    if (data.receiverId) {
      receiver = await this.userService.userById(data.receiverId);
      if (!receiver) {
        throw new Error(`Receiver with id ${data.receiverId} not found`);
      }
    }
    const updated = Timestamp.now();
    let updateObject: Partial<TransactionModel> = {
      status,
      updated,
    };
    if (data.images) {
      updateObject.images = data.images;
    }
    if (data.gsImageUrls) {
      updateObject.gsImageUrls = data.gsImageUrls;
    }
    if (data.receiverId) {
      updateObject.receiverId = data.receiverId;
    }
    await db.collection("transactions").doc(id).update(updateObject);
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
    if (receiver) {
      toList.push(receiver.email);
    }
    if (emailDetail) {
      await sendNotificationViaEmail(
        toList,
        ccList,
        emailDetail.subject,
        emailDetail.body,
        "transaction/" + id
      );
    }
    let rv: Transaction = {
      id: id,
      item: item,
      requestor: requestor,
      receiver: receiver,
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

  async receiveTransaction(
    receiver: User,
    id: string,
    images: string[]
  ): Promise<Transaction> {
    // Logic to receive a transaction
    const data = await this._transactionById(id);
    if (data.status !== TransactionStatus.Transfered) {
      throw new Error(
        `Transaction with id ${id} is not in transfered status, current status: ${data.status}`
      );
    }
    if (data.locationType !== TransactionLocation.FaceToFace) {
      // only the requestor can receive the transaction
      const receiverId = data.receiverId ? data.receiverId : data.requestorId;
      if (receiverId !== receiver.id) {
        throw new Error(
          `User with id ${receiver.id} is not the receiver of transaction with id ${id}`
        );
      }
    } else {
      data.receiverId = receiver.id;
    }

    // update the item holder to the requestor
    const item = await this.itemService.itemById(data.itemId);
    if (!item) {
      throw new Error(`Item with id ${data.itemId} not found`);
    }

    let gsImageUrls: string[] | null = null;
    let publicImageUrls: string[] | null = null;

    if (images && images.length > 0) {
      for (const image of images) {
        console.debug(`Processing image: ${image}`);
        if (image.startsWith("gs://")) {
          try {
            const publicUrl = await GetPublicUrlForGSFile(image);
            console.debug(`Public URL for image ${image}: ${publicUrl}`);
            if (!gsImageUrls) gsImageUrls = [];
            if (!publicImageUrls) publicImageUrls = [];
            publicImageUrls.push(publicUrl);
            gsImageUrls.push(image);
          } catch (error) {
            console.error(
              `Failed to get public URL for image ${image}:`,
              error
            );
          }
        } else {
          if (!publicImageUrls) publicImageUrls = [];
          publicImageUrls.push(image);
        }
      }
    }

    const updated = await this.itemService.updateItemHolder(item.id, receiver);
    if (!updated) {
      throw new Error(
        `Failed to update item holder for item with id ${item.id}`
      );
    }
    const emailDetail: EmailDetail = {
      subject: `Transaction Received for Item: ${item.name}`,
      body: `Your transaction request for item ${item.name} has been received.`,
    };
    let owner: User = receiver;
    if (item.ownerId !== receiver.id) {
      let ownerRv = await this.userService.userById(item.ownerId);
      if (!ownerRv) {
        throw new Error(`Owner with id ${item.ownerId} not found`);
      }
      owner = ownerRv;
    }

    if (publicImageUrls && publicImageUrls.length > 0) {
      data.images = publicImageUrls;
    }

    if (gsImageUrls && gsImageUrls.length > 0) {
      data.gsImageUrls = gsImageUrls;
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
