import { db, LoginUser } from "./platform";
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
import { MapService, createMapService } from "./mapService";
import firebase from "firebase-admin"; 
import { p } from "graphql-ws/dist/common-DY-PBNYy";

type ItemModel = Omit<Item, 'id'> & {
  geohash?: string;
};
  



export class ItemService {
  private mapService: MapService;

  constructor() {
    this.mapService = createMapService();
  }

  async itemsByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db.collection("items").where("geohash", ">=", "");
    if (category)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const items = this.mapService.getLocationsByRadius(query, { latitude, longitude }, radiusKm);
    const filteredItems = (await items).map((item) => {
        item = { ...item, id: item.id };
        return item as Item;
    });
    return filteredItems;
  }


  async itemById(
    itemId: string
  ): Promise<Item | null> {
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists) return null;
    const data = itemDoc.data() as ItemModel;
    return { id: itemId, ...data } as Item;
  }

  // this function should be limited to internal use only
  async itemsByIds(itemIds: string[]): Promise<Item[]> {
    if (!itemIds || itemIds.length === 0) {
      return [];
    }

    // Firestore 'in' queries are limited (currently 30 clauses).
    // If you expect more IDs, you'll need to batch the requests.
    const MAX_IDS_PER_QUERY = 30;
    const results: Item[] = [];

    for (let i = 0; i < itemIds.length; i += MAX_IDS_PER_QUERY) {
      const batchIds = itemIds.slice(i, i + MAX_IDS_PER_QUERY);
      if (batchIds.length > 0) {
        const snapshot = await db
          .collection("items")
          .where(firebase.firestore.FieldPath.documentId(), "in", batchIds)
          .get();
        
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Item));
        results.push(...items);
      }
    }
    return results;
  }


  async itemsByUser(
    userId: string,
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db
      .collection("items")
      .where("ownerId", "==", userId)
      .orderBy("id");
    if (category)
      query = query.where("category", "array-contains-any", category);
    if (status) query = query.where("status", "==", status);
    if (keyword)
      query = query
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    const snapshot = await query.limit(limit).offset(offset).get();
    const items = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Item)
    );
    return items;
  }

  async createItem(
    owner: User,
    name: string,
    description: string,
    condition: ItemCondition,
    category: string[],
    status: ItemStatus,
    images: string[],
    publishedYear: number,
    language: Language
  ): Promise<Item> {
    let hash = null;
    if (owner?.location) {
      hash = geofire.geohashForLocation([owner.location.latitude, owner.location.longitude]);
    }

    const itemData: ItemModel = {
      ownerId: owner.id,
      name: name,
      description: description || undefined,
      condition: condition,
      category: category,
      status: status,
      images: images || [],
      publishedYear: publishedYear || undefined,
      language: language,
      createdAt: new Date().toISOString(),
      location: owner?.location || undefined,
      geohash: hash || undefined,
    };
    const docRef = await db.collection("items").add(itemData);
    const rv = {id: docRef.id, ...itemData } as Item; // Set the ID after adding to Firestore
    return rv
  }
}
