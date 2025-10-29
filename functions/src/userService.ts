import { db, LoginUser } from "./platform";
import {
  User,
  ContactMethod,
  Location,
  Role,
  Item,
  RecommendationType,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { MapService, createMapService } from "./mapService";
import { Timestamp } from "firebase-admin/firestore";
import { CategoryService } from "./categoryService";
import { RecommendService } from "./recommendService";
import { user } from "firebase-functions/v1/auth";

const userCollection = db.collection("users");

const MAX_PINNED_ITEMS = 5;

type UserModel = Omit<User, "createdAt" | "pinItems"> & {
  geohash?: string;
  created: Timestamp;
  pinItemIds?: string[];
};

type ItemCacheModel = {
  categories: string[];
};

export class UserService {
  private mapService: MapService;
  private itemService: ItemService;
  private categoryService: CategoryService;

  // all cache for user data
  private userCache: Map<string, User> = new Map();

  constructor(itemService: ItemService, categoryService: CategoryService) {
    this.mapService = createMapService();
    this.itemService = itemService;
    this.categoryService = categoryService;

    // Set circular reference after construction
    this.itemService.setUserService(this);
  }

  async me(loginUser: LoginUser | null): Promise<User | null> {
    if (!loginUser) throw new Error("Not authenticated");
    // check if user's email is verified
    const user = await this.userById(loginUser.uid);
    if (!user) return null;
    if (!user.isVerified && loginUser.emailVerified) {
      // update user to verified if email is verified
      await userCollection.doc(loginUser.uid).update({ isVerified: true });
    }
    // return user data
    return user;
  }

  async userById(userId: string): Promise<User | null> {
    const cachedUser = this.userCache.get(userId);
    if (cachedUser) return cachedUser;
    return this._userById(userId);
  }

  async userModelById(userId: string): Promise<UserModel | null> {
    const userDoc = await userCollection.doc(userId).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as UserModel;
    return data;
  }

  async _userById(userId: string): Promise<User | null> {
    // fetch user from database
    const data = await this.userModelById(userId);
    if (!data) return null;
    const user = await this.updateCache(data);
    return user;
  }

  async pinItem(
    userModel: UserModel,
    itemId: string,
    recommendService: RecommendService
  ): Promise<boolean> {
    const item = await this.itemService.itemById(itemId);
    if (!item) {
      throw new Error("Item not found.");
    }
    if (item.ownerId !== userModel.id) {
      throw new Error("Cannot pin item not owned by user.");
    }

    if (!userModel.pinItemIds) {
      userModel.pinItemIds = [];
    } else if (userModel.pinItemIds.includes(itemId)) {
      throw new Error("Item already pinned.");
    } else if (userModel.pinItemIds.length >= MAX_PINNED_ITEMS) {
      userModel.pinItemIds.shift(); // remove the oldest pinned item
    }

    userModel.pinItemIds.push(itemId);
    await userCollection
      .doc(userModel.id)
      .update({ pinItemIds: userModel.pinItemIds });
    await this.updateCache(userModel); // update cache
    await recommendService.updateRecommendation(
      userModel.id,
      RecommendationType.UserPicked,
      item
    );
    return true;
  }

  async unpinItem(userModel: UserModel, itemId: string): Promise<boolean> {
    if (!userModel.pinItemIds || userModel.pinItemIds.length === 0) {
      throw new Error("No items pinned.");
    }
    const itemIndex = userModel.pinItemIds.indexOf(itemId);
    if (itemIndex === -1) {
      throw new Error("Item not pinned.");
    }

    userModel.pinItemIds.splice(itemIndex, 1);
    await userCollection
      .doc(userModel.id)
      .update({ pinItemIds: userModel.pinItemIds });
    await this.updateCache(userModel); // update cache
    return true;
  }

  /**
   * Gets the user item category based on items in the user's collection.
   * If one is not available, then compute the value.
   * @param userId
   * @returns
   */
  async getOrComputeUserItemCategory(userId: string) {
    var itemCategory = await this.categoryService.getUserItemCategory(userId);

    if (!itemCategory || itemCategory.length === 0) {
      const categoryCount = await this.itemService.itemCategoriesByUser(userId);
      itemCategory = await this.categoryService.initializeUserCategories(
        userId,
        categoryCount
      );
    }
    return itemCategory;
  }

  async addItemToUser(user: User, item: Item): Promise<void> {
    // update item cache for all exchange points
    for (const exchangePoint of user.exchangePoints || []) {
      await this._AddItemCacheToExchangePoint(
        exchangePoint,
        new Map([[item.id, { categories: item.category || [] }]])
      );
    }
  }

  async updateItemToUser(user: User, item: Item): Promise<void> {
    // update item cache for all exchange points
    for (const exchangePoint of user.exchangePoints || []) {
      await this._RemoveItemCacheFromExchangePoint(exchangePoint, [item.id]);
      await this._AddItemCacheToExchangePoint(
        exchangePoint,
        new Map([[item.id, { categories: item.category || [] }]])
      );
    }
  }

  async createUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");

    let resolvedLocation: Location | undefined | null = undefined;

    if (address) {
      resolvedLocation = await this.mapService.resolveLocationAndGeohash(
        address
      );
    }

    const userData: UserModel = {
      id: loginUser.uid,
      email: loginUser.email,
      nickname: nickname || undefined,
      location: resolvedLocation
        ? {
            latitude: resolvedLocation.latitude,
            longitude: resolvedLocation.longitude,
          }
        : undefined,
      address: address || undefined,
      role: Role.User,
      isActive: true,
      isVerified: false,
      created: Timestamp.now(),
      geohash: resolvedLocation?.geohash || undefined,
    };
    await userCollection.doc(loginUser.uid).set(userData);
    return { createdAt: userData.created.seconds * 1000, ...userData } as User;
  }

  async exchangePoints(
    limit: number = 20,
    offset: number = 0
  ): Promise<User[]> {
    const usersSnapshot = await userCollection
      .where("role", "==", Role.ExchangePointAdmin)
      .orderBy("created", "desc")
      .limit(limit)
      .offset(offset)
      .get();

    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data() as UserModel;
      users.push({ createdAt: data.created.seconds * 1000, ...data } as User);
    });

    return users;
  }

  async exchangePointsCount(): Promise<number> {
    const usersSnapshot = await userCollection
      .where("role", "==", Role.ExchangePointAdmin)
      .get();

    return usersSnapshot.size;
  }

  async updateUser(
    loginUser: LoginUser | null,
    nickname?: string | null,
    address?: string | null,
    contactMethods?: ContactMethod[] | null,
    exchangePoints?: string[] | null
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");

    const userRef = userCollection.doc(loginUser.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const updates: { [key: string]: any } = {};

    if (nickname != null) {
      updates.nickname = nickname;
    }

    if (contactMethods != null) {
      updates.contactMethods = contactMethods;
    }

    if (address != null) {
      const oldAddress = userDoc.data()?.address;

      if (address !== oldAddress) {
        let resolvedLocation = await this.mapService.resolveLocationAndGeohash(
          address
        );

        await this.itemService.updateUserItemsLocation(
          loginUser.uid,
          resolvedLocation
        );

        if (resolvedLocation) {
          updates.address = address;
          updates.location = {
            latitude: resolvedLocation.latitude,
            longitude: resolvedLocation.longitude,
            geohash: resolvedLocation.geohash,
          };
          updates.geohash = resolvedLocation.geohash;
        } else {
          updates.address = null;
          updates.location = null;
          updates.geohash = null;
        }
      }
    }

    if (exchangePoints != null) {
      // ensure all exchange points are valid and Role.ExchangePointAdmin
      let validExchangePoints: string[] = [];
      if (exchangePoints.length !== 0) {
        validExchangePoints = exchangePoints.filter((point) =>
          this.isValidExchangePoint(point)
        );
        if (validExchangePoints.length === 0) {
          throw new Error("Invalid exchange points");
        }
      }
      updates.exchangePoints = validExchangePoints;
      const oldExchangePoints: string[] = userDoc.data()?.exchangePoints || [];
      const newExchangePoints = validExchangePoints.filter(
        (point) => !oldExchangePoints.includes(point)
      );
      const removedExchangePoints = oldExchangePoints.filter(
        (point) => !validExchangePoints.includes(point)
      );
      if (newExchangePoints.length > 0 || removedExchangePoints.length > 0) {
        // update item and categories cache in exchange points
        let offset = 0;
        while (true) {
          const itemsPerUser = await this.itemService.itemsByUser(
            loginUser.uid,
            [], // category
            undefined, // status
            undefined, // keyword
            100, // limit
            offset // offset
          );
          if (itemsPerUser.length === 0) break;
          offset += itemsPerUser.length;
          // map items to categories
          const itemCacheModelMap: Map<string, ItemCacheModel> = new Map();
          for (const item of itemsPerUser) {
            const itemCacheModel: ItemCacheModel = {
              categories: item.category || [],
            };
            itemCacheModelMap.set(item.id, itemCacheModel);
          }
          // add item cache to new exchange points
          for (const point of newExchangePoints) {
            await this._AddItemCacheToExchangePoint(point, itemCacheModelMap);
          }
          // remove item cache from removed exchange points
          for (const point of removedExchangePoints) {
            await this._RemoveItemCacheFromExchangePoint(
              point,
              Array.from(itemCacheModelMap.keys())
            );
          }
        }
        // update CategoryCache for exchange points
        const userItemCategories = await this.getOrComputeUserItemCategory(
          loginUser.uid
        );
        for (const point of newExchangePoints) {
          await this.categoryService.upsertExchangePointCategoryCache(
            point,
            userItemCategories
          );
        }
        for (const point of removedExchangePoints) {
          await this.categoryService.removeExchangePointCategoryCache(
            point,
            userItemCategories
          );
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      console.debug("update: ", updates);
      await userRef.update(updates);
    }

    const updatedDoc = await userRef.get();
    const data = updatedDoc.data() as UserModel;
    const updatedUser = await this.updateCache(data);
    return updatedUser;
  }

  private async _AddItemCacheToExchangePoint(
    userId: string,
    itemCacheModelMap: Map<string, ItemCacheModel>
  ) {
    const itemCacheCollection = userCollection
      .doc(userId)
      .collection("itemCache");

    // add item cache to exchange point's itemCacheCollections
    for (const [itemId, itemCacheModel] of itemCacheModelMap.entries()) {
      await itemCacheCollection.doc(itemId).set(itemCacheModel);
    }
  }

  private async isValidExchangePoint(userId: string): Promise<boolean> {
    const user = await this.userById(userId);
    if (!user) return false;
    return user.role === Role.ExchangePointAdmin;
  }

  private async _RemoveItemCacheFromExchangePoint(
    userId: string,
    itemIds: string[]
  ) {
    const itemCacheCollection = userCollection
      .doc(userId)
      .collection("itemCache");

    // remove item cache from exchange point's itemCacheCollections
    for (const itemId of itemIds) {
      await itemCacheCollection.doc(itemId).delete();
    }
  }

  async getItemCaches(
    userId: string,
    categories?: string[],
    limit: number = 20,
    offset: number = 0
  ): Promise<string[]> {
    const itemCacheCollection = userCollection
      .doc(userId)
      .collection("itemCache");

    let query = itemCacheCollection.orderBy("__name__"); // Order by document ID for consistent pagination

    // Apply category filter if provided
    if (categories && categories.length > 0) {
      query = query.where("categories", "array-contains-any", categories);
    }

    const snapshot = await query.limit(limit).offset(offset).get();

    if (snapshot.empty) {
      console.debug(
        `No cached items found for user ${userId} with categories ${categories}`
      );
      return [];
    }

    // Return the document IDs (which are the item IDs)
    const itemIds = snapshot.docs.map((doc) => doc.id);

    console.debug(
      `Found ${itemIds.length} cached item IDs for user ${userId} with categories ${categories}`
    );

    return itemIds;
  }

  async updateCache(userModel: UserModel): Promise<User> {
    // get all pinned items
    let pinItems: Item[] = [];
    if (userModel.pinItemIds && userModel.pinItemIds.length > 0) {
      pinItems = await this.itemService.itemsByIds(userModel.pinItemIds);
    }
    const itemCategory = await this.getOrComputeUserItemCategory(userModel.id);
    const updatedUser = {
      createdAt: userModel.created.seconds * 1000,
      pinItems,
      ...userModel,
      ...(itemCategory && { itemCategory }),
    } as User;
    this.userCache.set(userModel.id, updatedUser);
    return updatedUser;
  }
}
