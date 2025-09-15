import { ItemCommentsConnection, ItemCommentPageInfo, ItemComment } from "./generated/graphql";
import { db } from "./platform";

export class CommentService {
  private dummyComments: ItemComment[];

  constructor() {
    // Generate 100 dummy comments
    this.dummyComments = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      content: `Dummy comment #${i}`,
    }));
  }

  // Placeholder allow us to select implementation for testing.
  async commentsByItemId(
    itemId: string,
    first: number = 10,
    after?: string
  ): Promise<ItemCommentsConnection> {
    return this.getCommentsFromDB(itemId, first, after);
  }

  // Dummy for testing only.
  // TODO: Delete later
  async dummyCommentsByItemId(
    itemId: string,
    first: number = 10,
    after?: string
  ): Promise<ItemCommentsConnection> {
    // Find the starting index based on after cursor
    let startIdx = 0;
    if (after) {
      const idx = parseInt(after, 10);
      if (!isNaN(idx) && idx >= 0 && idx < this.dummyComments.length) {
        startIdx = idx + 1;
      }
    }

    const comments = this.dummyComments.slice(startIdx, startIdx + first);
    const endIdx = startIdx + comments.length - 1;

    const pageInfo: ItemCommentPageInfo = {
      startCursor: String(startIdx),
      endCursor: String(endIdx),
      hasNextPage: endIdx < this.dummyComments.length - 1,
    };

    return {
      comments,
      pageInfo,
    };
  }

  // Creating a single item.
  // TODO: Delete later
  async singleCommentsByItemId(
    itemId: string,
    first: number = 10,
    after?: string
  ): Promise<ItemCommentsConnection> {
    const comment = {
      id: String(1),
      content: "Dummy comment",
    };
    const pageInfo: ItemCommentPageInfo = {
      startCursor: String(1),
      endCursor: String(1),
      hasNextPage: false,
    };
    const comments = [comment];
    return {
      comments,
      pageInfo,
    };
  }

 
  // Placeholder
  async getCommentsFromDB(
    itemId: string,
    first: number = 10,
    after?: string
  ): Promise<ItemCommentsConnection> {

    const results: ItemComment[] = [];

    // Use xdTqRAC8a5eAyyjaihnJ as example
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
      startCursor: String(1),
      endCursor: String(1),
      hasNextPage: false,
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

      if (after) {
        const dbComments = await db.collection("items").doc(itemId)
        .collection("comments")
        .startAt(after)
        .limit(first)
        .get();
        return dbComments;
      }
      else {
        const dbComments = await db.collection("items").doc(itemId)
        .collection("comments")
        .limit(first)
        .get();
        return dbComments;
      }
  }
}