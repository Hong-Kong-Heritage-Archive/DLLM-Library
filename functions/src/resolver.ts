import * as admin from 'firebase-admin';
import { Resolvers, Location, Item, User, ContactMethod} from './generated/graphql';
var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");


const projectId = process.env.GCLOUD_PROJECT || 'dllm-libray';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}
);

const db = admin.firestore();

interface Context {
  user: { uid: string; email: string } | null;
}





export const resolvers = {
  Query: {
    me: async (_: any, __: any, { user }: Context): Promise<User | null> => {
      console.log(user);
      if (!user) throw new Error('Not authenticated');
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) return null;
      const data = userDoc.data() as User;
      return { ...data };
    },
    itemsByLocation: async (
      _: any,
      { latitude, longitude, radiusKm, category, status, keyword, limit = 20, offset = 0 }: any
    ): Promise<Item[]> => {
      let query = db.collection('items').orderBy('id');
      if (category) query = query.where('category', 'array-contains-any', category);
      if (status) query = query.where('status', '==', status);
      if (keyword) query = query.where('name', '>=', keyword).where('name', '<=', keyword + '\uf8ff');

      const snapshot = await query.limit(limit).offset(offset).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));

      // Haversine formula for radius filtering (Firestore lacks native geospatial)
      const filteredItems = items.filter(item => {
        if (!item.location) return false;
        const R = 6371; // Earth's radius in km
        const dLat = (item.location.latitude - latitude) * Math.PI / 180;
        const dLon = (item.location.longitude - longitude) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(item.location.latitude * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance <= radiusKm;
      });

      return filteredItems;
    },
  },
  Mutation: {
    createUser: async (_: any, { nickname, address }: any, { user }: Context): Promise<User> => {
      if (!user) throw new Error('Not authenticated');
      const userData: User = {
        id: user.uid,
        email: user.email,
        nickname: nickname || undefined,
        location: undefined,  // require to resolve from google map base on address
        address: address || undefined,
        createdAt: new Date().toISOString(),
      };
      await db.collection('users').doc(user.uid).set(userData);
      return userData;
    },
    updateUser: async (_: any, { nickname, contactMethods, address }: any, { user }: Context): Promise<User> => {
      if (!user) throw new Error('Not authenticated');
      const updates: Partial<User> = {
        nickname: nickname || undefined,
        contactMethods: contactMethods || undefined,
        location: undefined,  // require to resolve from google map base on address
        address: address || undefined,
      };
      await db.collection('users').doc(user.uid).update(updates);
      const updatedDoc = await db.collection('users').doc(user.uid).get();
      return { ...(updatedDoc.data() as User) };
    },
    createItem: async (_: any, args: any, { user }: Context): Promise<Item> => {
      if (!user) throw new Error('Not authenticated');
      const itemData: Item = {
        id: '',
        ownerId: user.uid,
        name: args.name,
        description: args.description || undefined,
        condition: args.condition,
        category: args.category,
        status: args.status,
        images: args.images || [],
        publishedYear: args.publishedYear || undefined,
        language: args.language,
        //location: undefined,  // require to get from user service 's location
        createdAt: new Date().toISOString(),
      };
      const docRef = await db.collection('items').add(itemData);
      itemData.id = docRef.id; // Set the ID after adding to Firestore
      return { ...itemData };
    },
  },
  User: {
    items: async (parent: User): Promise<Item[]> => {
      const snapshot = await db.collection('items').where('ownerId', '==', parent.id).get();
      return snapshot.docs.map(doc => ({  ...doc.data() } as Item));
    },
  }
};