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
import { MapService } from "./mapService";
import { p } from "graphql-ws/dist/common-DY-PBNYy";

type ItemModel = Omit<Item, 'id'> & {
  geohash?: string;
};
  



export class ItemService {
  constructor(private mapService: MapService = new MapService()) {
    
  }

  async itemsByLocation(
    loginUser: LoginUser | null,
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

  async itemsByLocation1(
    loginUser: LoginUser | null,
    latitude: number,
    longitude: number,
    radiusKm: number,
    category: string[],
    status: string,
    keyword: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Item[]> {
    let query = db.collection("items").orderBy("createdAt", "desc");
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
    // Haversine formula for radius filtering (Firestore lacks native geospatial)
    const filteredItems = items.filter((item) => {
      if (!item.location) return false;
      const R = 6371; // Earth's radius in km
      const dLat = ((item.location.latitude - latitude) * Math.PI) / 180;
      const dLon = ((item.location.longitude - longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((latitude * Math.PI) / 180) *
          Math.cos((item.location.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      console.log(`distance:` + distance + " " + item.location.latitude + " " + item.location.longitude);
      return distance <= radiusKm;
    });
    return filteredItems;
  }


  async itemById(
    loginUser: LoginUser | null,
    itemId: string
  ): Promise<Item | null> {
    const itemDoc = await db.collection("items").doc(itemId).get();
    if (!itemDoc.exists) return null;
    const data = itemDoc.data() as Item;
    return { ...data };
  }

  async itemsByUser(
    loginUser: LoginUser | null,
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
      //location: undefined,  // require to get from user service 's location
      createdAt: new Date().toISOString(),
      location: owner?.location || undefined,
      geohash: hash || undefined,
    };
    const docRef = await db.collection("items").add(itemData);
    const rv = {id: docRef.id, ...itemData } as Item; // Set the ID after adding to Firestore
    return rv
  }
}
