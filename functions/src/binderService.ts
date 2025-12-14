import { db, GetPublicUrlForGSFile } from "./platform";
import { Binder, Bind, BindType, Role, User } from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { Timestamp } from "firebase-admin/firestore";

type BinderModel = Omit<Binder, "owner" | "id" | "updatedAt"> & {
  ownerId: string;
  updated: Timestamp;
  bindIds?: string[];
  gsImageUrls?: string[];
  gsThumbnailUrls?: string[];
};

const BinderCollectionName = "binders";

const BinderCollection = db.collection(BinderCollectionName);

export class BinderService {
  constructor(
    private itemService: ItemService,
    private userService: UserService // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async binder(binderId: string): Promise<Binder | null> {
    const binderDoc = await BinderCollection.doc(binderId).get();
    if (!binderDoc.exists) return null;
    const data = binderDoc.data() as BinderModel;
    if (!data) return null;
    const rv = await this.converyBinderModelToBinder(data, binderId);
    return rv;
  }

  private async converyBinderModelToBinder(
    binderModel: BinderModel,
    binderId: string
  ): Promise<Binder> {
    const owner = await this.userService.userById(binderModel.ownerId);
    if (!owner) throw new Error("User not found");
    let rv = {
      id: binderId,
      owner: owner,
      updatedAt: binderModel.updated.seconds * 1000,
      ...binderModel,
    } as Binder;
    return rv;
  }

  async createBinder(
    owner: User,
    parentId: string,
    name: string,
    bind: Bind
  ): Promise<Binder> {
    if (!owner || !owner.isVerified) {
      throw new Error("Only verified users can create binders");
    }

    // check for the parent binder exists
    let parentBinderDoc:
      | FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
      | undefined = undefined;
    if (parentId) {
      parentBinderDoc = await BinderCollection.doc(parentId).get();
      if (!parentBinderDoc.exists) {
        throw new Error("Parent binder not found");
      }
    } else {
      // if parnetId is empty, this is root binder for user, check if user already has root binder
      await BinderCollection.doc(owner.id)
        .get()
        .then((doc) => {
          if (doc.exists) {
            throw new Error("Root binder already exists for user");
          }
        });
    }
    const now = new Timestamp(Math.ceil(Date.now() / 1000), 0);

    const binderModel: BinderModel = {
      ownerId: owner.id,
      name: name,
      bindIds: [bind.id],
      binds: [bind],
      updated: now,
      bindedCount: 1,
    };

    let docRef = undefined;
    let binderId = owner.id;
    if (parentId) {
      docRef = await BinderCollection.add(binderModel);
      binderId = docRef.id;
    } else {
      docRef = BinderCollection.doc(owner.id);
      await docRef.set(binderModel);
    }
    const rv: Binder = await this.converyBinderModelToBinder(
      binderModel,
      binderId
    );
    if (!rv) throw new Error("Failed to create binder");
    if (parentBinderDoc) {
      const newBind: Bind = {
        id: rv.id,
        type: BindType.Binder,
        name: rv.name,
      };
      await this._addBindToParentBinder(
        parentBinderDoc,
        newBind,
        bind.id,
        null
      );
    }
    return rv;
  }
  /*
  async addBindToBinder(
    binderId: string,
    bindId: string, // Item ID or Binder ID
    beforeBindId: string, // Item ID or Binder ID to insert before, null to append at the end
    bindType: BindType,
    name: string // item name or binder name for preview
  ): Promise<Binder>;
  */

  private async _addBindToParentBinder(
    parentBinderDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    bind: Bind,
    removeBindIdInParent: string | null,
    beforeBindId: string | null
  ): Promise<void> {
    const parentBinderData = parentBinderDoc.data() as BinderModel;
    if (!parentBinderData) {
      throw new Error("Parent binder data not found");
    }
    let binds = parentBinderData.binds || [];
    let bindIds = parentBinderData.bindIds || [];
    if (beforeBindId) {
      const index = binds.findIndex((b) => b.id === beforeBindId);
      if (index >= 0) {
        binds.splice(index, 0, bind);
        bindIds.splice(index, 0, bind.id);
      } else {
        binds.push(bind);
        bindIds.push(bind.id);
      }
    } else {
      binds.push(bind);
      bindIds.push(bind.id);
    }
    if (removeBindIdInParent) {
      binds = binds.filter((b) => b.id !== removeBindIdInParent);
      bindIds = bindIds.filter((id) => id !== removeBindIdInParent);
    }
    parentBinderData.binds = binds;
    parentBinderData.bindIds = bindIds;
    parentBinderData.updated = new Timestamp(Math.ceil(Date.now() / 1000), 0);
    await BinderCollection.doc(parentBinderDoc.id).set(parentBinderData);
  }
}
