import { ItemCommentsConnection, ItemCommentPageInfo, ItemComment } from "./generated/graphql";
import { db } from "./platform";

export class CommentService {

  // Placeholder allow us to select implementation for testing.
  async commentsByItemId(
    itemId: string,
    first: number = 10,
    after?: string
  ): Promise<ItemCommentsConnection> {

    const results: ItemComment[] = [];

    //Use startAt() and endAt() to limit contents.
    const dbComments = await this.queryCommentFromDB(itemId, first, after);

    dbComments.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        content: data.content,
      });
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
    after?: string
  ): Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>> {

    const commentsRef = db.collection("items").doc(itemId).collection("comments");
    if (after) {
      // Get the document to retrieve its createdAt value
      const afterDoc = await commentsRef.doc(after).get();
      const afterCreatedAt = afterDoc.get("createdAt");
      const dbComments = await commentsRef
        .orderBy("createdAt")
        .startAfter(afterCreatedAt)
        .limit(first)
        .get();
      return dbComments;
    } else {
      const dbComments = await commentsRef
        .orderBy("createdAt")
        .limit(first)
        .get();
      return dbComments;
    }
  }

  // Add a comment to an item
  async addItemComment(itemId: string, content: string): Promise<string> {
    const commentRef = await db
      .collection("items")
      .doc(itemId)
      .collection("comments")
      .add({
        content,
        createdAt: new Date(),
      });
    return commentRef.id;
  }

  // Delete a comment from an item
  async deleteItemComment(itemId: string, commentId: string): Promise<boolean> {
    try {
      await db
        .collection("items")
        .doc(itemId)
        .collection("comments")
        .doc(commentId)
        .delete(); 
        // returns true here regardless of whether the document existed or not
      return true;
    } catch (e) {
      console.error("Failed to delete comment:", e);
      return false;
    }
  }
}