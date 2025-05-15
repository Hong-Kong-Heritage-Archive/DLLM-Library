"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const admin = __importStar(require("firebase-admin"));
var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");
const projectId = process.env.GCLOUD_PROJECT || 'dllm-libray';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
exports.resolvers = {
    Query: {
        me: async (_, __, { user }) => {
            console.log(user);
            if (!user)
                throw new Error('Not authenticated');
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists)
                return null;
            const data = userDoc.data();
            return { ...data };
        },
        itemsByLocation: async (_, { latitude, longitude, radiusKm, category, status, keyword, limit = 20, offset = 0 }) => {
            let query = db.collection('items').orderBy('id');
            if (category)
                query = query.where('category', 'array-contains-any', category);
            if (status)
                query = query.where('status', '==', status);
            if (keyword)
                query = query.where('name', '>=', keyword).where('name', '<=', keyword + '\uf8ff');
            const snapshot = await query.limit(limit).offset(offset).get();
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Haversine formula for radius filtering (Firestore lacks native geospatial)
            const filteredItems = items.filter(item => {
                if (!item.location)
                    return false;
                const R = 6371; // Earth's radius in km
                const dLat = (item.location.latitude - latitude) * Math.PI / 180;
                const dLon = (item.location.longitude - longitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
        createUser: async (_, { nickname, address }, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            const userData = {
                id: user.uid,
                email: user.email,
                nickname: nickname || undefined,
                location: undefined, // require to resolve from google map base on address
                address: address || undefined,
                createdAt: new Date().toISOString(),
            };
            await db.collection('users').doc(user.uid).set(userData);
            return userData;
        },
        updateUser: async (_, { nickname, contactMethods, address }, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            const updates = {
                nickname: nickname || undefined,
                contactMethods: contactMethods || undefined,
                location: undefined, // require to resolve from google map base on address
                address: address || undefined,
            };
            await db.collection('users').doc(user.uid).update(updates);
            const updatedDoc = await db.collection('users').doc(user.uid).get();
            return { ...updatedDoc.data() };
        },
        createItem: async (_, args, { user }) => {
            if (!user)
                throw new Error('Not authenticated');
            const itemData = {
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
        items: async (parent) => {
            const snapshot = await db.collection('items').where('ownerId', '==', parent.id).get();
            return snapshot.docs.map(doc => ({ ...doc.data() }));
        },
    }
};
