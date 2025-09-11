import { db, GetPublicUrlForGSFile } from "./platform";
import {
  Item,
  Location,
  LocationInput,
  ItemCondition,
  ItemStatus,
  Language,
  User,
} from "./generated/graphql";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

type CategoryModel = {
  count: number;
  updated: Timestamp;
  recommended: boolean;
};

export class CategoryService {
  constructor() {}

  async upsertCategories(owner: User, categories: string[]): Promise<void> {
    if (!categories || categories.length === 0) {
      console.log("No categories provided for upsert");
      return;
    }

    const batch = db.batch();
    const now = Timestamp.now();

    for (const category of categories) {
      const categoryRef = db.collection("categories").doc(category);
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(1),
          updated: now,
        },
        { merge: true }
      );
    }

    // Verify that the category is initialized before calling this.
    // Do a check here as we do not have access to ItemService.
    // Handle case where the user does not have any item categories.
    var itemCategory = await this.getUserItemCategory(owner.id);
    if (!itemCategory) {
      console.warn("User's item categories are not initialized: " + owner.id);
      throw new Error("User's item categories are not initialized:" + owner.id);
    }

    // Update user's itemCategory subcollection
    if (owner && owner.id) {
      const userCategoryCollection = db
        .collection("users")
        .doc(owner.id)
        .collection("itemCategory");

      for (const category of categories) {
        const userCategoryRef = userCategoryCollection.doc(category);
        batch.set(
          userCategoryRef,
          {
            count: firebase.firestore.FieldValue.increment(1),
            updated: now,
          },
          { merge: true }
        );
      }
    }

    await batch.commit();
    console.log(`Upserted categories: ${categories.join(", ")}`);

    // update user's exchange points's item and category cache
    if (owner.exchangePoints && owner.exchangePoints.length > 0) {
      const itemCategory = categories.map((category) => ({
        category,
        count: 1,
      }));
      for (const exchangePointId of owner.exchangePoints) {
        await this.upsertExchangePointCategoryCache(
          exchangePointId,
          itemCategory
        );
      }
    }
  }

  /**
   * @param categoriesMap Array of objects: { category: string, count: number }
   */
  async initializeUserCategories(
    userId: string,
    categoriesMap: { [category: string]: number }
  ): Promise<{ category: string; count: number }[]> {
    if (!categoriesMap || Object.keys(categoriesMap).length === 0) {
      console.warn("No categories provided for upsert");
      return [];
    }

    let batch = db.batch();
    const now = Timestamp.now();

    const maxBatchSize = 20;
    let batchCount = 0;

    // Update global categories
    for (const [category, count] of Object.entries(categoriesMap)) {
      if (!category || typeof count !== "number") continue;
      const categoryRef = db.collection("categories").doc(category);
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(count),
          updated: now,
        },
        { merge: true }
      );
      batchCount++;
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();

    batchCount = 0;

    batch = db.batch();
    // Reset batch for user categories
    // Update user's itemCategory subcollection
    const userCategoryCollection = db
      .collection("users")
      .doc(userId)
      .collection("itemCategory");
    console.log("Initializing user categories for user: " + userId);
    for (const [category, count] of Object.entries(categoriesMap)) {
      if (!category || typeof count !== "number") continue;
      const userCategoryRef = userCategoryCollection.doc(category);
      batch.set(
        userCategoryRef,
        {
          count: firebase.firestore.FieldValue.increment(count),
          updated: now,
        },
        { merge: true }
      );
      batchCount++;
      if (batchCount >= maxBatchSize) {
        console.log(
          "Committing batch of user categories for user: " +
            userId +
            " starting with " +
            category
        );
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();
    console.log(
      `Upserted categories with counts: ${Object.entries(categoriesMap)
        .map(([category, count]) => `${category} (+${count})`)
        .join(", ")}`
    );

    const itemCategory = Object.entries(categoriesMap).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    return itemCategory;
  }

  async getUserItemCategory(userId: string) {
    const categorySnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("itemCategory")
      .orderBy("count", "desc")
      .get();

    let itemCategory = categorySnapshot.docs.map((doc) => ({
      category: doc.id,
      count: doc.data().count,
    }));

    // Check if user is an exchange point admin by looking for itemCategoryCache
    const cacheSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("itemCategoryCache")
      .orderBy("count", "desc")
      .get();

    if (!cacheSnapshot.empty) {
      // User is an exchange point admin, merge the cache data
      const cacheCategories = cacheSnapshot.docs.map((doc) => ({
        category: doc.id,
        count: doc.data().count,
      }));

      // Create a map to combine counts from both sources
      const combinedCategories = new Map<string, number>();

      // Add user's own item categories
      itemCategory.forEach(({ category, count }) => {
        combinedCategories.set(category, count);
      });

      // Add cached categories (from exchange point)
      cacheCategories.forEach(({ category, count }) => {
        const existingCount = combinedCategories.get(category) || 0;
        combinedCategories.set(category, existingCount + count);
      });

      // Convert back to array format
      itemCategory = Array.from(combinedCategories.entries()).map(
        ([category, count]) => ({
          category,
          count,
        })
      );

      console.log(
        `Combined categories for exchange point admin ${userId}: ${itemCategory.length} categories`
      );
    }

    return itemCategory;
  }

  async upsertExchangePointCategoryCache(
    exchangePointId: string,
    categories: { category: string; count: number }[]
  ): Promise<void> {
    if (!exchangePointId || !categories) return;

    const batch = db.batch();
    const now = Timestamp.now();

    const exchangePointCategoryCollection = db
      .collection("users")
      .doc(exchangePointId)
      .collection("itemCategoryCache");

    for (const { category, count } of categories) {
      if (!category || typeof count !== "number") continue;
      const categoryRef = exchangePointCategoryCollection.doc(category);
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(count),
          updated: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(
      `Upserted exchange point categories for ${exchangePointId}: ${categories
        .map(({ category, count }) => `${category} (+${count})`)
        .join(", ")}`
    );
  }

  async removeExchangePointCategoryCache(
    exchangePointId: string,
    categories: { category: string; count: number }[]
  ): Promise<void> {
    if (!exchangePointId || !categories) return;

    const batch = db.batch();
    const now = Timestamp.now();

    const exchangePointCategoryCollection = db
      .collection("users")
      .doc(exchangePointId)
      .collection("itemCategoryCache");

    for (const { category, count } of categories) {
      if (!category || typeof count !== "number") continue;
      const categoryRef = exchangePointCategoryCollection.doc(category);
      // if the category does not exist, skip
      const categoryDoc = await categoryRef.get();
      if (!categoryDoc.exists) continue;
      // Decrement the count and update the timestamp
      // If count is greater than the current count, delete the category
      // to avoid negative counts.
      // This is to ensure that we do not end up with negative counts.
      // If the count is 0, we can delete the category.
      const currentCount = categoryDoc.data()?.count || 0;
      if (currentCount <= count) {
        batch.delete(categoryRef);
        continue;
      }
      batch.set(
        categoryRef,
        {
          count: firebase.firestore.FieldValue.increment(-count),
          updated: now,
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(
      `Removed exchange point categories for ${exchangePointId}: ${categories
        .map(({ category, count }) => `${category} (-${count})`)
        .join(", ")}`
    );
  }

  async getRecentUpdateCategories(limit: number = 10): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .orderBy("updated", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async getHotCategories(limit: number = 10): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .orderBy("count", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async getDefaultCategories(): Promise<string[]> {
    const snapshot = await db
      .collection("categories")
      .where("recommended", "==", true)
      .get();

    return snapshot.docs.map((doc) => doc.id);
  }

  async reduceCategories(owner: User, categories: string[]): Promise<void> {
    if (!categories || categories.length === 0) {
      console.log("No categories provided for reduction");
      return;
    }

    const batch = db.batch();
    const now = Timestamp.now();

    // First, get current user's item categories to check counts
    const userItemCategories = await this.getUserItemCategory(owner.id);
    const userCategoryMap = new Map(
      userItemCategories.map((cat) => [cat.category, cat.count])
    );

    // Update global categories and user's itemCategory subcollection
    const userCategoryCollection = db
      .collection("users")
      .doc(owner.id)
      .collection("itemCategory");

    const categoriesToRemoveFromExchangePoint: {
      category: string;
      count: number;
    }[] = [];

    for (const category of categories) {
      const userCurrentCount = userCategoryMap.get(category) || 0;

      if (userCurrentCount <= 0) {
        console.warn(
          `Category ${category} has no items for user ${owner.id}, skipping`
        );
        continue;
      }

      // Reduce global category count
      const globalCategoryRef = db.collection("categories").doc(category);
      const globalCategoryDoc = await globalCategoryRef.get();

      if (globalCategoryDoc.exists) {
        const globalCurrentCount = globalCategoryDoc.data()?.count || 0;
        if (globalCurrentCount <= 1) {
          // If this is the last item in this category globally, delete the category
          batch.delete(globalCategoryRef);
        } else {
          // Otherwise, decrement the count
          batch.set(
            globalCategoryRef,
            {
              count: firebase.firestore.FieldValue.increment(-1),
              updated: now,
            },
            { merge: true }
          );
        }
      }

      // Reduce user's category count
      const userCategoryRef = userCategoryCollection.doc(category);
      if (userCurrentCount <= 1) {
        // If this is the user's last item in this category, delete the category
        batch.delete(userCategoryRef);
      } else {
        // Otherwise, decrement the count
        batch.set(
          userCategoryRef,
          {
            count: firebase.firestore.FieldValue.increment(-1),
            updated: now,
          },
          { merge: true }
        );
      }

      // Track categories to remove from exchange point cache
      categoriesToRemoveFromExchangePoint.push({ category, count: 1 });
    }

    await batch.commit();
    console.log(`Reduced categories: ${categories.join(", ")}`);

    // Update user's exchange points's item and category cache
    if (
      owner.exchangePoints &&
      owner.exchangePoints.length > 0 &&
      categoriesToRemoveFromExchangePoint.length > 0
    ) {
      for (const exchangePointId of owner.exchangePoints) {
        await this.removeExchangePointCategoryCache(
          exchangePointId,
          categoriesToRemoveFromExchangePoint
        );
      }
    }
  }

  async removeCategoriesForUser(
    userId: string,
    categoriesMap: { [category: string]: number }
  ): Promise<{ category: string; count: number }[]> {
    if (!categoriesMap || Object.keys(categoriesMap).length === 0) {
      console.warn("No categories provided for removal");
      return [];
    }

    // Get current user categories to validate removal
    const currentUserCategories = await this.getUserItemCategory(userId);
    const currentCategoryMap = new Map(
      currentUserCategories.map((cat) => [cat.category, cat.count])
    );

    let batch = db.batch();
    const now = Timestamp.now();
    const maxBatchSize = 20;
    let batchCount = 0;

    const actualRemovals: { category: string; count: number }[] = [];

    // Update global categories
    for (const [category, countToRemove] of Object.entries(categoriesMap)) {
      if (!category || typeof countToRemove !== "number" || countToRemove <= 0)
        continue;

      const globalCategoryRef = db.collection("categories").doc(category);
      const globalCategoryDoc = await globalCategoryRef.get();

      if (globalCategoryDoc.exists) {
        const globalCurrentCount = globalCategoryDoc.data()?.count || 0;

        if (globalCurrentCount <= countToRemove) {
          // If removing all or more items than exist, delete the category
          batch.delete(globalCategoryRef);
          actualRemovals.push({ category, count: globalCurrentCount });
        } else {
          // Otherwise, decrement the count
          batch.set(
            globalCategoryRef,
            {
              count: firebase.firestore.FieldValue.increment(-countToRemove),
              updated: now,
            },
            { merge: true }
          );
          actualRemovals.push({ category, count: countToRemove });
        }

        batchCount++;
        if (batchCount >= maxBatchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) await batch.commit();

    // Reset batch for user categories
    batch = db.batch();
    batchCount = 0;

    // Update user's itemCategory subcollection
    const userCategoryCollection = db
      .collection("users")
      .doc(userId)
      .collection("itemCategory");

    console.log("Removing user categories for user: " + userId);

    for (const [category, countToRemove] of Object.entries(categoriesMap)) {
      if (!category || typeof countToRemove !== "number" || countToRemove <= 0)
        continue;

      const currentUserCount = currentCategoryMap.get(category) || 0;

      if (currentUserCount <= 0) {
        console.warn(
          `User ${userId} has no items in category ${category}, skipping`
        );
        continue;
      }

      const userCategoryRef = userCategoryCollection.doc(category);

      if (currentUserCount <= countToRemove) {
        // If removing all or more items than user has, delete the category
        batch.delete(userCategoryRef);
      } else {
        // Otherwise, decrement the count
        batch.set(
          userCategoryRef,
          {
            count: firebase.firestore.FieldValue.increment(-countToRemove),
            updated: now,
          },
          { merge: true }
        );
      }

      batchCount++;
      if (batchCount >= maxBatchSize) {
        console.log(
          "Committing batch of user category removals for user: " +
            userId +
            " starting with " +
            category
        );
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) await batch.commit();

    console.log(
      `Removed categories with counts: ${actualRemovals
        .map(({ category, count }) => `${category} (-${count})`)
        .join(", ")}`
    );

    return actualRemovals;
  }

  async decrementCategoriesForUser(
    userId: string,
    categories: string[]
  ): Promise<void> {
    if (!categories || categories.length === 0) {
      console.log("No categories provided for decrement");
      return;
    }

    // Convert to categoriesMap format for consistency
    const categoriesMap: { [category: string]: number } = {};
    categories.forEach((category) => {
      categoriesMap[category] = 1;
    });

    await this.removeCategoriesForUser(userId, categoriesMap);
  }
}
