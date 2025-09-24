import { 
  User, 
  ItemCommentsConnection, 
  ItemCommentPageInfo, 
  ItemComment 
} from "./generated/graphql";
import { UserService } from "./userService";
import { db } from "./platform";
import { FieldPath } from "firebase-admin/firestore";
import { log } from "console";

export class CommentService {

  constructor(private userService: UserService) {}

  // Placeholder allow us to select implementation for testing.
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
        userNickname: "Unknown",
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : data.createdAt.toDate().toISOString(),
        content: data.content,
      });

      for (const result of results) {
        this.userService.userById(result.userId).then(user => {
          if (user) {
            result.userNickname = user.nickname ?? "Unknown";
          }
        });
      }
    });
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
    const commentRef = await db
      .collection("items")
      .doc(itemId)
      .collection("comments")
      .add({
        userId: currentUser.id,
        content,
        createdAt: now,
        updatedAt: now,
      });
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

      await commentDocRef.delete();
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

      await commentDocRef.update({
        content,
        updatedAt: new Date(),
      });
      return true;
    } catch (e) {
      console.error("Failed to edit comment:", e);
      throw e;
    }
  }
}