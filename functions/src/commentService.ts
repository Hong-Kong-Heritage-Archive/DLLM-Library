import { 
  User, 
  ItemCommentsConnection, 
  ItemCommentsByUserConnection,
  ItemCommentPageInfo, 
  ItemComment, 
  ItemCommentByUser,
} from "./generated/graphql";
import { UserService } from "./userService";
import { db } from "./platform";
import { FieldPath } from "firebase-admin/firestore";
import { log } from "console";

export class CommentService {

  constructor(private userService: UserService) {}

  // Placeholder allow us to select implementation for testing.
  async commentsByUserId(
    userId: string,
    first: number = 10,
    startAfterId?: string,
    startAfterDate?: Date,
  ): Promise<ItemCommentsByUserConnection> {
    const results: ItemCommentByUser[] = [];

    const userCommentsRef = db.collection("users").doc(userId).collection("itemComments");

    let userCommentsSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>;
    if (startAfterId && startAfterDate) {
      userCommentsSnapshot = await userCommentsRef
        .orderBy("createdAt", "desc")
        .orderBy("commentId", "desc")
        .startAfter(startAfterDate, startAfterId)
        .limit(first)
        .get();
    } else {
      userCommentsSnapshot = await userCommentsRef
        .orderBy("createdAt", "desc")
        .orderBy("commentId", "desc")
        .limit(first)
        .get();
    }

    // fetch user nickname once
    const user = await this.userService.userById(userId);
    const nickname = user ? user.nickname ?? "Unknown Nickname" : "Unknown User";

    for (const doc of userCommentsSnapshot.docs) {
      const data = doc.data();
      // expected fields: itemId, commentId, createdAt, updatedAt
      const itemId = data.itemId as string;
      const commentId = data.commentId as string;

      // fetch actual comment content from item comment document
      const commentDocRef = db.collection("items").doc(itemId).collection("comments").doc(commentId);
      const commentDoc = await commentDocRef.get();
      if (!commentDoc.exists) {
        // Skip if the comment was removed on the item side.
        continue;
      }
      const commentData = commentDoc.data();

      results.push({
        itemId,
        commentId,
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : data.createdAt.toDate().toISOString(),
        content: commentData?.content ?? "Data missing",
      } as ItemCommentByUser);
    }

    const pageInfo: ItemCommentPageInfo = {
      startCursor: results.length > 0 ? results[0].commentId : null,
      endCursor: results.length > 0 ? results[results.length - 1].commentId : null,
      hasNextPage: userCommentsSnapshot.size === first,
    };

    return {
      comments: results,
      pageInfo,
    };
  }

  async commentsByItemId(
    itemId: string,
    first: number = 10,
    startAfterId?: string,
    startAfterDate?: Date,
  ): Promise<ItemCommentsConnection> {

    const results: ItemComment[] = [];

    //Use startAt() and endAt() to limit contents.
    const dbComments = await this.queryCommentFromDB(itemId, first, startAfterId, startAfterDate );

    dbComments.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        userId: data.userId,
        userNickname: "Unknown User",
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : data.createdAt.toDate().toISOString(),
        content: data.content,
      });
    });

    for (const result of results) {
      const user = await this.userService.userById(result.userId);
      if ( user ){
        result.userNickname = user.nickname ?? "Unknown Nickname";
      }
    }

    const pageInfo: ItemCommentPageInfo = {
      startCursor: results.length > 0 ? results[0].id : null,
      endCursor: results.length > 0 ? results[results.length - 1].id : null,
      hasNextPage: dbComments.size === first,
    };
    
    return {
      comments: results,
      pageInfo,
    };
  }

  async queryCommentFromDB(
    itemId: string,
    first: number = 10,
    startAfterId?: string,
    startAfterDate?: Date
  ): Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>> {

    const commentsRef = db.collection("items").doc(itemId).collection("comments");
    if (startAfterId && startAfterDate) {
      const dbComments = await commentsRef
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .startAfter(startAfterDate, startAfterId)
        .limit(first)
        .get();
      return dbComments;
    } else {
      const dbComments = await commentsRef
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc")
        .limit(first)
        .get();
      return dbComments;
    }
  }

  // Add a comment to an item
  async addItemComment(currentUser: User, itemId: string, content: string): Promise<string> {
    const now = new Date();

    const commentRef = db.collection("items").doc(itemId).collection("comments").doc(); // client id
    const userCommentRef = db.collection("users").doc(currentUser.id).collection("itemComments").doc();

    const batch = db.batch();

    batch.create(commentRef, {
      userId: currentUser.id,
      content,
      createdAt: now,
      updatedAt: now,
    });

    batch.create(userCommentRef, {
      itemId,
      commentId: commentRef.id,
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();
    return commentRef.id;
  }

  // Delete a comment from an item
  // Now checks userID before deleting
  async deleteItemComment(currentUser: User, itemId: string, commentId: string): Promise<boolean> {
    try {
      const commentDocRef = db
        .collection("items")
        .doc(itemId)
        .collection("comments")
        .doc(commentId);

      const commentDoc = await commentDocRef.get();

      if (!commentDoc.exists) {
        throw new Error("Comment does not exist.");
      }

      const commentData = commentDoc.data();
      if (!commentData || commentData.userId !== currentUser.id) {
        throw new Error("You do not have permission to delete this comment.");
      }

      // Delete both the comment document and the corresponding user itemComments entry(ies) in a batch
      const batch = db.batch();

      // delete the comment itself
      batch.delete(commentDocRef);

      // find any user-side itemComments referencing this comment and delete them
      const userCommentsRef = db.collection("users").doc(currentUser.id).collection("itemComments");
      const userCommentsQuery = await userCommentsRef
        .where("commentId", "==", commentId)
        .where("itemId", "==", itemId)
        .get();

      userCommentsQuery.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return true;
    } catch (e) {
      console.error("Failed to delete comment:", e);
      throw e;
    }
  }

  // Edit a comment on an item
  async editItemComment(currentUser: User, itemId: string, commentId: string, content: string): Promise<boolean> {
    try {
      const commentDocRef = db
        .collection("items")
        .doc(itemId)
        .collection("comments")
        .doc(commentId);

      const commentDoc = await commentDocRef.get();

      if (!commentDoc.exists) {
        throw new Error("Comment does not exist.");
      }

      const commentData = commentDoc.data();
      if (!commentData || commentData.userId !== currentUser.id) {
        throw new Error("You do not have permission to edit this comment.");
      }

      const now = new Date();

      // Update both the comment itself and any user-side itemComments entries in a batch
      const batch = db.batch();

      batch.update(commentDocRef, {
        content,
        updatedAt: now,
      });

      const userCommentsRef = db.collection("users").doc(currentUser.id).collection("itemComments");
      const userCommentsQuery = await userCommentsRef
        .where("commentId", "==", commentId)
        .where("itemId", "==", itemId)
        .get();

      userCommentsQuery.forEach((doc) => {
        batch.update(doc.ref, {
          updatedAt: now,
        });
      });

      await batch.commit();
      return true;
    } catch (e) {
      console.error("Failed to edit comment:", e);
      throw e;
    }
  }
}