import { db, LoginUser } from "./platform";
import {
  User,
  ContactMethod,
  Location,
  Role,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { MapService, createMapService } from "./mapService";
import * as geofire from "geofire-common";
import { Timestamp } from "firebase-admin/firestore";
import { create } from "domain";


type UserModel = Omit<User, "createdAt" > & {
  geohash?: string;
  created: Timestamp;
};

export class UserService {
  private mapService: MapService;

  constructor(private itemService: ItemService) {
    this.mapService = createMapService();
  }

  async me(loginUser: LoginUser | null): Promise<User | null> {
    if (!loginUser) throw new Error("Not authenticated");
    // check if user's email is verified
    const userDoc = await db.collection("users").doc(loginUser.uid).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as UserModel;
    if (!data.isVerified && loginUser.emailVerified) {
      // update user to verified if email is verified
      await db.collection("users").doc(loginUser.uid).update({ isVerified: true });
    }
    return { createdAt: data.created.seconds * 1000, ...data } as User;
  }

  async userById(
    loginUser: LoginUser | null,
    userId: string
  ): Promise<User | null> {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) return null;
    const data = userDoc.data() as UserModel;
    return { createdAt: data.created.seconds * 1000, ...data } as User;
  }

  async createUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");

    let resolvedLocation: Location | undefined | null = undefined;
    
    if (address) {
      resolvedLocation = await this.mapService.resolveLocationAndGeohash(address); 
    }

    const userData: UserModel = {
      id: loginUser.uid,
      email: loginUser.email,
      nickname: nickname || undefined,
      location: resolvedLocation ? { latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude } : undefined,
      address: address || undefined,
      role: Role.User,
      isActive: true,
      isVerified: false,
      created: Timestamp.now(),
      geohash: resolvedLocation?.geohash || undefined,
    };
    await db.collection("users").doc(loginUser.uid).set(userData);
    return {createdAt: userData.created.seconds * 1000, ...userData} as User;
  }

  async updateUser(
    loginUser: LoginUser | null,
    nickname: string,
    address: string,
    contactMethods: ContactMethod[]
  ): Promise<User> {
    if (!loginUser) throw new Error("Not authenticated");
    let resolvedLocation: Location | undefined | null = undefined;

    if (address) {
      resolvedLocation = await this.mapService.resolveLocationAndGeohash(address);
    }
    const updates: Partial<UserModel> = {
      nickname: nickname || undefined,
      contactMethods: contactMethods || undefined,
      location: resolvedLocation ? { latitude: resolvedLocation.latitude, longitude: resolvedLocation.longitude } : undefined,
      address: address || undefined,
      geohash: resolvedLocation?.geohash || undefined,
    };
    await db.collection("users").doc(loginUser.uid).update(updates);
    const updatedDoc = await db.collection("users").doc(loginUser.uid).get();
    return { ...(updatedDoc.data() as User) };
  }
}
