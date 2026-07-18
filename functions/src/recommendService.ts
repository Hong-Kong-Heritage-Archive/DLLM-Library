import { db } from "./platform";
import { RecommendationType, Item } from "./generated/graphql";
import firebase from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { ItemService } from "./itemService";
import { UserModel } from "./userService";
import { sampleRandom } from "./utils/randomUtils";

type RecommendModel = {
  updated: Timestamp;
  categories: string[];
  recommendationType: RecommendationType;
  itemId: string; // 可選的，存儲推薦的物品ID
};

/** Max docs to fetch before in-memory random sample (Firestore has no ORDER BY RANDOM). */
const RANDOM_SAMPLE_CAP = 100;

export class RecommendService {
  private itemService: ItemService;
  private recommendCollection: firebase.firestore.CollectionReference<RecommendModel>;
  constructor(itemService: ItemService) {
    this.itemService = itemService;
    this.recommendCollection = db.collection(
      "recommendations",
    ) as firebase.firestore.CollectionReference<RecommendModel>;
  }

  async updateRecommendation(
    userId: string,
    recommendationType: RecommendationType,
    item: Item,
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
    userModel: UserModel | null,
    recommendationType: RecommendationType,
    category: string | null,
    _offset: number = 0,
    limit: number = 12,
  ): Promise<Item[]> {
    if (recommendationType === RecommendationType.NewArrivals) {
      // Sample from a recent window so bulk uploads do not dominate the banner.
      const pool = await this.itemService.latestItems(
        userModel,
        0,
        RANDOM_SAMPLE_CAP,
      );
      return sampleRandom(pool, limit);
    }
    let query = this.recommendCollection
      .where("recommendationType", "==", recommendationType)
      .orderBy("updated", "desc");

    if (category && category.trim() !== "") {
      query = query.where("categories", "array-contains", category);
    }
    let snapshot = await query.limit(RANDOM_SAMPLE_CAP).get();
    let docs = sampleRandom(snapshot.docs, limit);
    const itemIds: string[] = [];
    docs.forEach((doc) => {
      const data = doc.data() as RecommendModel;
      itemIds.push(data.itemId);
    });
    const items = await this.itemService.itemsByIds(userModel, itemIds);
    return items;
  }
}
