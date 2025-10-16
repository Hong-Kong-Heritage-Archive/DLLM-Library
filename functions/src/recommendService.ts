import { db, GetPublicUrlForGSFile } from "./platform";
import { RecommendationType, User, Item } from "./generated/graphql";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ItemService } from "./itemService";
import { get } from "axios";
import { randomInt } from "crypto";

type RecommendModel = {
  updated: Timestamp;
  categories: string[];
  recommendationType: RecommendationType;
  itemId: string; // 可選的，存儲推薦的物品ID
};

export class RecommendService {
  private itemService: ItemService;
  private recommendCollection: firebase.firestore.CollectionReference<RecommendModel>;
  constructor(itemService: ItemService) {
    this.itemService = itemService;
    this.recommendCollection = db.collection(
      "recommendations"
    ) as firebase.firestore.CollectionReference<RecommendModel>;
  }

  async updateRecommendation(
    userId: String,
    recommendationType: RecommendationType,
    item: Item
  ): Promise<void> {
    const categories = item.category;
    const docId = `${userId}_${recommendationType}`;
    const docRef = this.recommendCollection.doc(docId);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data()!;
      data.itemId = item.id; // 更新推薦的物品ID
      data.updated = Timestamp.now();
      data.categories = categories;
    } else {
      const newData: RecommendModel = {
        updated: Timestamp.now(),
        categories,
        recommendationType,
        itemId: item.id,
      };
      await docRef.set(newData);
    }
  }

  async recommendationItems(
    recommendationType: RecommendationType,
    category: string | null,
    limit: number = 10
  ): Promise<Item[]> {
    let query = this.recommendCollection
      .where("recommendationType", "==", recommendationType)
      .orderBy("updated", "desc");

    if (category && category.trim() !== "") {
      query = query.where("categories", "array-contains", category);
    }
    let snapshot = await query.get();
    if (snapshot.size > limit) {
      // 如果超過限制，則只返回前幾個
      const offset = randomInt(0, snapshot.size - limit + 1);
      snapshot = await query.offset(offset).limit(limit).get();
    }

    const itemIds: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data() as RecommendModel;
      itemIds.push(data.itemId);
    });
    const items = await this.itemService.itemsByIds(itemIds);
    return items;
  }
}
