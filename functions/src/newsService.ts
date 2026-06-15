import { db, GetPublicUrlForGSFile } from "./platform";
import {
  NewsPost,
  NewsStatus,
  Role,
  User,
  NewsType,
} from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { Timestamp } from "firebase-admin/firestore";

type NewsModel = Omit<
  NewsPost,
  "user" | "id" | "createdAt" | "updatedAt" | "relatedItems" | "coEditors"
> & {
  relatedItemIds?: string[];
  userId: string;
  coEditorIds?: string[];
  created: Timestamp;
  updated: Timestamp;
  gsImageUrls?: string[];
};

export class NewsService {
  constructor(
    private itemService: ItemService,
    private userService: UserService, // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async NewsById(
    loginUser: User | null,
    newsId: string,
  ): Promise<NewsPost | null> {
    const newsDoc = await db.collection("news").doc(newsId).get();
    if (!newsDoc.exists) return null;
    const data = newsDoc.data() as NewsModel;
    if (!data) return null;
    const rv = await this.converyNewsModelToNewsPost(loginUser, data, newsId);
    return rv;
  }

  async RecentNews(
    loginUser: User | null,
    keyword: string | null | undefined,
    tags: string[],
    limit: number = 20,
    offset: number = 0,
    newsType: NewsType | undefined | null,
    newsStatus: NewsStatus | undefined | null,
    itemId: string | null | undefined,
  ): Promise<NewsPost[]> {
    let newsQuery = db
      .collection("news")
      .orderBy("updated", "desc")
      .limit(limit)
      .offset(offset);
    if (tags && tags.length > 0)
      newsQuery = newsQuery.where("tags", "array-contains-any", tags);
    if (keyword)
      newsQuery = newsQuery
        .where("name", ">=", keyword)
        .where("name", "<=", keyword + "\uf8ff");
    if (newsType) newsQuery = newsQuery.where("newsType", "==", newsType);
    if (newsStatus) newsQuery = newsQuery.where("newsStatus", "==", newsStatus);
    if (itemId)
      newsQuery = newsQuery.where("relatedItemIds", "array-contains", itemId);
    const newsDocs = await newsQuery.get();
    const newsPosts: NewsPost[] = [];
    for (const doc of newsDocs.docs) {
      const data = doc.data() as NewsModel;
      if (!data) continue;
      let dataChanged = false;
      if (!data.newsStatus) {
        data.newsStatus = NewsStatus.Published;
        dataChanged = true;
      }
      if (!data.newsType) {
        data.newsType = NewsType.Announcement;
        dataChanged = true;
      }
      if (dataChanged) {
        await doc.ref.update({
          newsStatus: data.newsStatus,
          newsType: data.newsType,
        });
      }

      const newsPost = await this.converyNewsModelToNewsPost(
        loginUser,
        data,
        doc.id,
      );
      newsPosts.push(newsPost);
    }
    return newsPosts;
  }

  private async converyNewsModelToNewsPost(
    loginUser: User | null,
    newsModel: NewsModel,
    newsId: string,
  ): Promise<NewsPost> {
    const user = await this.userService.userById(newsModel.userId);
    if (!user) throw new Error("User not found");
    // get all co-editors info    if (newsModel.coEditorIds && newsModel.coEditorIds.length > 0) {
    const coEditors = [];
    if (newsModel.coEditorIds && newsModel.coEditorIds.length > 0) {
      for (const coEditorId of newsModel.coEditorIds) {
        const coEditor = await this.userService.userById(coEditorId);
        if (coEditor) coEditors.push(coEditor);
      }
    }
    if (!newsModel.newsStatus) {
      newsModel.newsStatus = NewsStatus.Published;
    }
    if (!newsModel.newsType) {
      newsModel.newsType = NewsType.Announcement;
    }
    let rv = {
      id: newsId,
      user,
      //      createdAt: newsModel.created.toDate().toISOString(),
      //      updatedAt: newsModel.updated.toDate().toISOString(),
      createdAt: newsModel.created.seconds * 1000,
      updatedAt: newsModel.updated.seconds * 1000,
      coEditors,
      ...newsModel,
    } as NewsPost;
    if (newsModel.relatedItemIds && newsModel.relatedItemIds.length > 0) {
      // get related items by id
      const relatedItems = await this.itemService.itemsByIds(
        loginUser,
        newsModel.relatedItemIds,
      );
      rv.relatedItems = relatedItems;
    }
    return rv;
  }

  async _parseNewsContentToSyncWithRelatedItems(
    content: string | undefined,
    relatedItemIds: string[] | undefined,
  ): Promise<{ content: string; relatedItemIds: string[] }> {
    if (!content) content = "";
    if (!relatedItemIds) relatedItemIds = [];
    // check if content has item id in format :item{id="abc"} or :itemWithComment{id="abc", comment="..."} and extract item id, if item id exist, add it to relatedItemIds, otherwise, ignore it
    const regex = /:item(?:WithComment)?\{id="([^"]+)"(?: comment="[^"]*")?\}/g;
    let match;
    const foundItemIds = new Set<string>();
    while ((match = regex.exec(content)) !== null) {
      const itemId = match[1];
      foundItemIds.add(itemId);
    }
    // check if foundItemIds are not id item service, if so, ignore them, otherwise, add them to relatedItemIds
    for (const itemId of foundItemIds) {
      const exist = await this.itemService.itemExist(itemId);
      if (!exist) {
        foundItemIds.delete(itemId);
      }
    }
    // check if any relatedItemIds are not in item service, if so, ignore them, otherwise, add them to content
    for (const relatedItemId of relatedItemIds) {
      const exist = await this.itemService.itemExist(relatedItemId);
      if (!exist) {
        relatedItemIds = relatedItemIds.filter((id) => id !== relatedItemId);
      }
    }
    // check if any relatedItemIds are not in content, if so, add them to content
    for (const relatedItemId of relatedItemIds) {
      if (!foundItemIds.has(relatedItemId)) {
        content += `\n:item{id="${relatedItemId}"}`;
      }
    }
    // check if any item ids in content are not in relatedItemIds, if so, add them to relatedItemIds
    for (const itemId of foundItemIds) {
      if (!relatedItemIds.includes(itemId)) {
        relatedItemIds.push(itemId);
      }
    }
    return { content, relatedItemIds };
  }

  async createNews(
    owner: User,
    title: string,
    content: string,
    images: string[],
    relatedItemIds: string[],
    tags: string[],
    newsType: NewsType,
    newsStatus: NewsStatus,
  ): Promise<NewsPost> {
    if (!owner || !owner.role || owner.role !== Role.Admin) {
      throw new Error("Only admin can create news");
    }
    if (!newsStatus) {
      newsStatus = NewsStatus.Draft;
    }
    if (!newsType) {
      newsType = NewsType.Announcement;
    }
    const now = new Timestamp(Math.ceil(Date.now() / 1000), 0);
    let gsImageUrls: string[] | null = null;
    let publicImageUrls: string[] | null = null;
    if (images && images.length > 0) {
      for (const image of images) {
        console.debug(`Processing image: ${image}`);
        if (image.startsWith("gs://")) {
          try {
            const publicUrl = await GetPublicUrlForGSFile(image);
            console.debug(`Public URL for image ${image}: ${publicUrl}`);
            if (!gsImageUrls) gsImageUrls = [];
            if (!publicImageUrls) publicImageUrls = [];
            publicImageUrls.push(publicUrl);
            gsImageUrls.push(image);
          } catch (error) {
            console.error(
              `Failed to get public URL for image ${image}:`,
              error,
            );
          }
        } else {
          if (!publicImageUrls) publicImageUrls = [];
          publicImageUrls.push(image);
        }
      }
    }

    const parsedContent = await this._parseNewsContentToSyncWithRelatedItems(
      content,
      relatedItemIds,
    );
    content = parsedContent.content;
    relatedItemIds = parsedContent.relatedItemIds;

    const newsData: NewsModel = {
      userId: owner.id,
      title: title,
      content: content,
      images: publicImageUrls || [],
      gsImageUrls: gsImageUrls || [],
      relatedItemIds: relatedItemIds || [],
      isVisible: true,
      tags: tags || [],
      newsStatus: newsStatus,
      newsType: newsType,
      //location: undefined,  // require to get from user service 's location
      created: now,
      updated: now,
      coEditorIds: [], // TODO: support co-editing in the future
    };
    const docRef = await db.collection("news").add(newsData);

    // Owner is admin, so it will bypass censor.
    const rv = this.converyNewsModelToNewsPost(owner, newsData, docRef.id);
    return rv;
  }

  async updateNews(
    id: string,
    user: User,
    title: string | null | undefined,
    content: string | null | undefined,
    images: string[] | null | undefined,
    relatedItemIds: string[] | null | undefined,
    tags: string[] | null | undefined,
    newsStatus: NewsStatus | null | undefined,
    newsType: NewsType | null | undefined,
  ): Promise<NewsPost> {
    const docRef = await db.collection("news").doc(id).get();
    if (!docRef.exists) {
      throw new Error("News not found");
    }
    const newsModel = docRef.data() as NewsModel;
    if (!newsModel) {
      throw new Error("News data is invalid");
    }
    // check the status of news, if it's not co-editing
    if (
      newsModel.newsStatus !== NewsStatus.CoEditing &&
      user.role !== Role.Admin
    ) {
      throw new Error(
        "Only admin can update news that is not in co-editing status",
      );
    }
    const rv = await this._updateNews(
      id,
      newsModel,
      user,
      title,
      content,
      images,
      relatedItemIds,
      tags,
      newsStatus,
      newsType,
    );
    return rv;
  }

  async addItemToNewsPost(
    id: string,
    itemId: string,
    comment: string | null | undefined,
    user: User,
  ): Promise<NewsPost> {
    const docRef = await db.collection("news").doc(id).get();
    if (!docRef.exists) {
      throw new Error("News not found");
    }
    const newsModel = docRef.data() as NewsModel;
    if (!newsModel) {
      throw new Error("News data is invalid");
    }
    // check the status of news, if it's not co-editing
    if (
      newsModel.newsStatus !== NewsStatus.CoEditing &&
      user.role !== Role.Admin
    ) {
      throw new Error(
        "Only admin can update news that is not in co-editing status",
      );
    }
    let content = newsModel.content || "";
    let relatedItemIds = newsModel.relatedItemIds || [];
    let isItemIdsExist = false;
    if (!relatedItemIds.includes(itemId)) {
      relatedItemIds.push(itemId);
    } else {
      isItemIdsExist = true;
    }
    // remove existing item id in content in format :item{id="abc"} if it's already exist in content, otherwise, add it to content, this is to avoid duplicate item id in content when user add same item multiple times, the format of item id in content with comment is :itemWithComment{id="abc" comment="..."}
    const regex =
      /:item(?:WithComment)?\{id="([^"]+)"(?:, comment="[^"]*")?\}/g;
    let match;
    const foundItemIds = new Set<string>();
    while ((match = regex.exec(content)) !== null) {
      const existingItemId = match[1];
      if (existingItemId === itemId) {
        if (isItemIdsExist) {
          // remove the existing item id in content
          content = content.replace(match[0], "");
        }
      } else {
        foundItemIds.add(existingItemId);
      }
    }
    // if comment exist, add comment to next to Item id in content in format :comment{itemId="abc"}comment content
    // if the item id is already exist in content, add comment next to item id in content in format :itemWithComment{id="abc" comment="..."}
    // if the item id is already exist in content but without comment, replace it with format :itemWithComment{id="abc" comment="..."}
    const itemWithCommentRegex = new RegExp(
      `:itemWithComment\\{id="${itemId}" comment="[^"]*"\\}`,
      "g",
    );
    console.log("content before adding item:", content);
    const itemRegex = new RegExp(`:item\\{id="${itemId}"\\}`, "g");
    if (comment) {
      // replace all new line in comment with \n to avoid breaking the content format
      comment = comment.replace(/\n/g, "\\n");
      if (content.match(itemWithCommentRegex)) {
        // append user.nickname: comment at the end of comment in itemWithComment
        content = content.replace(itemWithCommentRegex, (match) => {
          const existingCommentMatch = match.match(/comment="([^"]*)"/);
          const existingComment = existingCommentMatch
            ? existingCommentMatch[1]
            : "";
          const newComment = `${existingComment}\n${user.nickname}: ${comment}`;
          return `:itemWithComment{id="${itemId}" comment="${newComment}"}`;
        });
      } else if (content.match(itemRegex)) {
        // replace item with item with comment
        content = content.replace(
          itemRegex,
          `:itemWithComment{id="${itemId}" comment="${user.nickname}: ${comment}"}`,
        );
      } else {
        // add item with comment to content
        content += `\n:itemWithComment{id="${itemId}" comment="${user.nickname}: ${comment}"}`;
      }
    }
    console.log("content after adding item:", content);
    const rv = await this._updateNews(
      id,
      newsModel,
      user,
      null,
      content,
      null,
      relatedItemIds,
      null,
      null,
      null,
    );
    return rv;
  }

  async lockNewsPost(id: string, user: User): Promise<boolean> {
    const docRef = await db.collection("news").doc(id).get();
    if (!docRef.exists) {
      throw new Error("News not found");
    }
    const newsModel = docRef.data() as NewsModel;
    if (!newsModel) {
      throw new Error("News data is invalid");
    }
    // only admin can lock news post
    if (user.role !== Role.Admin) {
      throw new Error("Only admin can lock news post");
    }
    const rv = await this._updateNews(
      id,
      newsModel,
      user,
      null,
      null,
      null,
      null,
      null,
      NewsStatus.Published,
      null,
    );
    return rv ? true : false;
  }

  async unlockNewsPost(id: string, user: User): Promise<boolean> {
    const docRef = await db.collection("news").doc(id).get();
    if (!docRef.exists) {
      throw new Error("News not found");
    }
    const newsModel = docRef.data() as NewsModel;
    if (!newsModel) {
      throw new Error("News data is invalid");
    }
    // only admin can unlock news post
    if (user.role !== Role.Admin) {
      throw new Error("Only admin can unlock news post");
    }
    const rv = await this._updateNews(
      id,
      newsModel,
      user,
      null,
      null,
      null,
      null,
      null,
      NewsStatus.CoEditing,
      null,
    );
    return rv ? true : false;
  }

  async _updateNews(
    id: string,
    newsModel: NewsModel,
    user: User,
    title: string | null | undefined,
    content: string | null | undefined,
    images: string[] | null | undefined,
    relatedItemIds: string[] | null | undefined,
    tags: string[] | null | undefined,
    newsStatus: NewsStatus | null | undefined,
    newsType: NewsType | null | undefined,
  ): Promise<NewsPost> {
    const now = new Timestamp(Math.ceil(Date.now() / 1000), 0);

    const newsData: Partial<NewsModel> = {
      updated: now,
      content: newsModel.content,
      relatedItemIds: newsModel.relatedItemIds,
    };
    if (user.id !== newsModel.userId) {
      // check if user in co-editors
      if (!newsModel.coEditorIds || newsModel.coEditorIds.length === 0) {
        newsData.coEditorIds = [user.id];
      } else if (!newsModel.coEditorIds.includes(user.id)) {
        newsData.coEditorIds = [...newsModel.coEditorIds, user.id];
      }
    }
    if (title) newsData.title = title;
    if (content) newsData.content = content;
    if (images) newsData.images = images;
    if (relatedItemIds) newsData.relatedItemIds = relatedItemIds;
    if (tags) newsData.tags = tags;
    if (newsStatus) newsData.newsStatus = newsStatus;
    if (newsType) newsData.newsType = newsType;
    const parsedContent = await this._parseNewsContentToSyncWithRelatedItems(
      newsData.content,
      newsData.relatedItemIds,
    );
    newsData.content = parsedContent.content;
    newsData.relatedItemIds = parsedContent.relatedItemIds;

    const docRef = await db.collection("news").doc(id).update(newsData);
    const updatedNewsModel = { ...newsModel, ...newsData } as NewsModel;

    const rv = this.converyNewsModelToNewsPost(user, updatedNewsModel, id);
    return rv;
  }
}
