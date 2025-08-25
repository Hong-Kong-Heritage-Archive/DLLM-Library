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
import * as geofire from "geofire-common";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { p } from "graphql-ws/dist/common-DY-PBNYy";
import { log } from "console";
import { b } from "graphql-ws/dist/server-CRG3y31G";

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
    console.log("Initializing user categories for user: " + userId );
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
        console.log("Committing batch of user categories for user: " + userId + " starting with " + category);
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
      .get();
    var itemCategory = categorySnapshot.docs.map((doc) => ({
      category: doc.id,
      count: doc.data().count,
    }));
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
      .collection("itemCategory");

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
      .collection("itemCategory");

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
}
