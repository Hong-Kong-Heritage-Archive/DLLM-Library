import { db, GetPublicUrlForGSFile } from "./platform";
import { Binder, Bind, BindType, BinderPath, User } from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { Timestamp } from "firebase-admin/firestore";
import { generateThumbnail, ThumbnailConfig } from "./utils/imageUtils";

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
    private userService: UserService
  ) {}

  async binder(binderId: string): Promise<Binder | null> {
    console.log(`Fetching binder with ID: ${binderId}`);
    const binderDoc = await BinderCollection.doc(binderId).get();
    if (!binderDoc.exists) return null;
    const data = binderDoc.data() as BinderModel;
    if (!data) return null;
    const rv = await this.convertBinderModelToBinder(data, binderId);
    return rv;
  }

  async binderFromItemId(itemId: string): Promise<Binder[] | null> {
    console.log(`Fetching binders containing Item ID: ${itemId}`);
    const querySnapshot = await BinderCollection.where(
      "bindIds",
      "array-contains",
      itemId
    ).get();
    if (querySnapshot.empty) return null;

    const binders: Binder[] = [];
    for (const doc of querySnapshot.docs) {
      const data = doc.data() as BinderModel;
      if (data) {
        const binder = await this.convertBinderModelToBinder(data, doc.id);
        binders.push(binder);
      }
    }
    return binders;
  }

  async binderPathsByUser(userId: string): Promise<BinderPath[]> {
    const binderDoc = await BinderCollection.doc(userId).get();
    if (!binderDoc.exists) return [];
    const paths: BinderPath[] = [];
    const visitedBinderIds = new Set<string>();
    const traverseBinder = async (binderId: string, currentPath: string) => {
      if (visitedBinderIds.has(binderId)) {
        return; // Prevent cycles
      }
      visitedBinderIds.add(binderId);

      const binderDoc = await BinderCollection.doc(binderId).get();
      if (!binderDoc.exists) return;
      const binderData = binderDoc.data() as BinderModel;
      if (!binderData) return;

      const newPath = currentPath
        ? `${currentPath} / ${binderData.name}`
        : binderData.name;
      console.log(`Binder path: ${newPath}`);
      paths.push({ id: binderId, path: newPath });

      if (binderData.binds && binderData.binds.length > 0) {
        for (const bind of binderData.binds) {
          if (bind.type === BindType.Binder) {
            await traverseBinder(bind.id, newPath);
          }
        }
      }
    };
    await traverseBinder(userId, "");
    return paths;
  }

  private async convertBinderModelToBinder(
    binderModel: BinderModel,
    binderId: string
  ): Promise<Binder> {
    const owner = await this.userService.userById(binderModel.ownerId);
    if (!owner) throw new Error("User not found");

    // Generate thumbnails if images exist but thumbnails don't
    if (
      binderModel.images &&
      binderModel.images.length > 0 &&
      !binderModel.thumbnails
    ) {
      console.log(`Generating thumbnails for binder ${binderId}`);
      binderModel.thumbnails = [];
      binderModel.gsThumbnailUrls = [];

      let images = binderModel.images;

      // Prefer GS URLs if available
      if (binderModel.gsImageUrls && binderModel.gsImageUrls.length > 0) {
        images = binderModel.gsImageUrls;
      }

      // Configure thumbnail generation for binders
      const thumbnailConfig: ThumbnailConfig = {
        scaleFactor: 0.3, // Slightly larger than items (30% size)
        quality: 50,
        filenameSuffix: "_binder_thumb",
        preserveDirectory: true,
        format: "jpeg",
        uploadPrefix: "binders/thumbnails",
      };

      const uploadPromises = images.map(async (image) => {
        const thumbnailResult = await generateThumbnail(image, thumbnailConfig);
        if (thumbnailResult) {
          binderModel.thumbnails!.push(thumbnailResult.url);
          binderModel.gsThumbnailUrls!.push(thumbnailResult.gs);
          console.log(
            `Generated binder thumbnail: ${thumbnailResult.width}x${thumbnailResult.height}, ${thumbnailResult.size} bytes`
          );
        }
      });

      await Promise.all(uploadPromises);

      // Update the document in Firestore with the new thumbnail URLs
      if (binderModel.thumbnails.length > 0) {
        try {
          const updateTime = Timestamp.now();
          await BinderCollection.doc(binderId).update({
            thumbnails: binderModel.thumbnails,
            gsThumbnailUrls: binderModel.gsThumbnailUrls,
            updated: updateTime,
          });
          binderModel.updated = updateTime;
          console.log(
            `Updated binder ${binderId} with ${binderModel.thumbnails.length} thumbnails`
          );
        } catch (error) {
          console.error(
            `Failed to update binder ${binderId} with thumbnails:`,
            error
          );
        }
      }
    }

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
      // if parentId is empty, this is root binder for user, check if user already has root binder
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
    const rv: Binder = await this.convertBinderModelToBinder(
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
      await this._addBindToParentBinder(parentBinderDoc, newBind, null);
    }
    return rv;
  }

  async addBindToBinder(
    owner: User,
    binderId: string,
    beforeBindId: string, // Item ID or Binder ID to insert before, null to append at the end
    bind: Bind
  ): Promise<Binder> {
    if (binderId === bind.id) {
      throw new Error("Cannot bind a binder to itself");
    }
    const binderDoc = await BinderCollection.doc(binderId).get();
    if (!binderDoc.exists) {
      throw new Error("Parent binder not found");
    }
    const binderData = binderDoc.data() as BinderModel;
    if (binderData.ownerId !== owner.id) {
      throw new Error("Not authorized to modify this binder");
    }
    await this._addBindToParentBinder(binderDoc, bind, beforeBindId);
    const updatedBinderDoc = await BinderCollection.doc(binderId).get();
    const updatedBinderData = updatedBinderDoc.data() as BinderModel;
    const rv = await this.convertBinderModelToBinder(
      updatedBinderData,
      binderId
    );
    return rv;
  }

  async updateBinder(
    owner: User,
    binderId: string,
    name: string | null,
    description: string | null,
    images: string[],
    bindIds: string[]
  ): Promise<Binder> {
    const binderDoc = await BinderCollection.doc(binderId).get();
    if (!binderDoc.exists) {
      throw new Error("Binder not found");
    }
    const binderData = binderDoc.data() as BinderModel;
    if (binderData.ownerId !== owner.id) {
      throw new Error("Not authorized to modify this binder");
    }

    let binds: Bind[] = [];
    // re-construct binds array based on bindIds
    // check the length of bindIds matches binderData.binds
    if (bindIds && bindIds.length > 0) {
      if (bindIds.length !== binderData.binds.length) {
        throw new Error("bindIds length does not match binds length");
      }
      for (const bindId of bindIds) {
        const existingBind = binderData.binds.find((b) => b.id === bindId);
        if (existingBind) {
          binds.push(existingBind);
        } else {
          throw new Error(`Bind with id ${bindId} not found in binder`);
        }
      }
    }

    // Process new images if provided
    let gsImageUrls: string[] = [];
    let publicImageUrls: string[] = [];

    if (images && images.length > 0) {
      for (const image of images) {
        console.debug(`Processing binder image: ${image}`);
        if (
          image.startsWith("gs://") &&
          !binderData.gsImageUrls?.includes(image)
        ) {
          try {
            let publicUrl = await GetPublicUrlForGSFile(image);
            console.debug(`Public URL for binder image ${image}: ${publicUrl}`);
            publicImageUrls.push(publicUrl);
            gsImageUrls.push(image);
          } catch (error) {
            console.error(
              `Failed to get public URL for binder image ${image}:`,
              error
            );
          }
        } else if (!image.startsWith("gs://")) {
          publicImageUrls.push(image);
        }
      }
    }

    // Build update data
    const updateData: Partial<BinderModel> = {
      updated: Timestamp.now(),
    };

    if (name) {
      binderData.name = name;
      updateData.name = name;
    }

    if (description !== null && description !== undefined) {
      binderData.description = description;
      updateData.description = description;
    }

    // Handle images update
    if (images !== undefined) {
      if (images.length === 0) {
        // Clear all images if empty array is provided
        binderData.images = [];
        binderData.gsImageUrls = [];
        binderData.thumbnails = [];
        binderData.gsThumbnailUrls = [];
        updateData.images = [];
        updateData.gsImageUrls = [];
        updateData.thumbnails = [];
        updateData.gsThumbnailUrls = [];
      } else {
        // Append new images to existing ones
        let existingPublicImages = binderData.images || [];
        let existingGsImages = binderData.gsImageUrls || [];

        binderData.images = [...existingPublicImages, ...publicImageUrls];
        binderData.gsImageUrls = [...existingGsImages, ...gsImageUrls];
        // filter duplicates
        binderData.images = Array.from(new Set(binderData.images));
        binderData.gsImageUrls = Array.from(new Set(binderData.gsImageUrls));
        updateData.images = binderData.images;
        updateData.gsImageUrls = binderData.gsImageUrls;

        // Clear thumbnails when images change - they'll be regenerated on next read
        binderData.thumbnails = [];
        binderData.gsThumbnailUrls = [];
        updateData.thumbnails = [];
        updateData.gsThumbnailUrls = [];
      }
    }

    if (binds.length > 0) {
      binderData.bindIds = bindIds;
      binderData.binds = binds;
      updateData.bindIds = bindIds;
      updateData.binds = binds;
    }

    await BinderCollection.doc(binderId).update(updateData);

    const rv = await this.convertBinderModelToBinder(binderData, binderId);
    return rv;
  }

  private async _addBindToParentBinder(
    parentBinderDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    bind: Bind,
    beforeBindId: string | null
  ): Promise<void> {
    const parentBinderData = parentBinderDoc.data() as BinderModel;
    if (!parentBinderData) {
      throw new Error("Parent binder data not found");
    }
    let binds = parentBinderData.binds || [];
    let bindIds = parentBinderData.bindIds || [];
    // update nothing if the bind already exists
    if (bindIds.includes(bind.id)) {
      return;
    }
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
    parentBinderData.binds = binds;
    parentBinderData.bindIds = bindIds;
    parentBinderData.updated = new Timestamp(Math.ceil(Date.now() / 1000), 0);
    await BinderCollection.doc(parentBinderDoc.id).set(parentBinderData);
    // increment the bindedCount of the binded binder if bind.type is Binder
    if (bind.type === BindType.Binder) {
      const bindedBinderDoc = await BinderCollection.doc(bind.id).get();
      if (bindedBinderDoc.exists) {
        const bindedBinderData = bindedBinderDoc.data() as BinderModel;
        bindedBinderData.bindedCount = (bindedBinderData.bindedCount || 0) + 1;
        await BinderCollection.doc(bind.id).set(bindedBinderData);
      }
    }
  }
}
