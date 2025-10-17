import { db } from "./platform";
import { RecommendationType, Item } from "./generated/graphql";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ItemService } from "./itemService";

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
    userId: string,
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
      await docRef.set(data);
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
    // Fetch up to a capped number of documents (e.g., 100)
    const CAP = 100;
    let snapshot = await query.limit(CAP).get();
    let docs = snapshot.docs;
    if (docs.length > limit) {
      // Randomly sample 'limit' documents from the fetched set
      const shuffled = docs.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      docs = shuffled.slice(0, limit);
    }
    const itemIds: string[] = [];
    docs.forEach((doc) => {
      const data = doc.data() as RecommendModel;
      itemIds.push(data.itemId);
    });
    const items = await this.itemService.itemsByIds(itemIds);
    return items;
  }
}
