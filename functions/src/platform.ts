import * as admin from 'firebase-admin';
import { Resolvers, Location, Item, User, ContactMethod} from './generated/graphql';
var serviceAccount = require("./dllm-libray-firebase-adminsdk.json");
export const googleMapsApiKey = serviceAccount.google_maps_api_key ?? '';

const projectId = process.env.GCLOUD_PROJECT || 'dllm-libray';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
}
);


interface LoginUser {
    uid: string; 
    email: string;
    emailVerified?: boolean; // Optional, if you want to check email verification
}

const db = admin.firestore();
const auth = admin.auth();
//const storage = admin.storage();
//const bucket = storage.bucket();

function getLoginUserFromToken(token: string): Promise<LoginUser | null> {
    return new Promise((resolve, reject) => {
        auth.verifyIdToken(token)
            .then((decodedToken) => {
                const loginUser: LoginUser = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    emailVerified: decodedToken.email_verified || false // Optional, if you want to check email verification
                };
                resolve(loginUser);
            }
            )
            .catch((error) => {
                console.error('Error verifying token:', error);
                resolve(null);
            }
        );
    });
}

export { getLoginUserFromToken, LoginUser, db };