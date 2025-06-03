import { db, LoginUser } from "./platform";
import { NewsPost, Role, User } from "./generated/graphql";
import { ItemService } from "./itemService";
import { UserService } from "./userService";
import { Timestamp } from "firebase-admin/firestore";

type NewsModel = Omit<
  NewsPost,
  "user" | "id" | "createdAt" | "updatedAt" | "relatedItems"
> & {
  relatedItemIds?: string[];
  userId: string;
  created: Timestamp;
  updated: Timestamp;
};

export class NewsService {
  constructor(
    private itemService: ItemService,
    private userService: UserService // geofire.geohashForLocation is a function that takes a location and returns a geohash
  ) {}

  async NewsById(newsId: string): Promise<NewsPost | null> {
    const newsDoc = await db.collection("news").doc(newsId).get();
    if (!newsDoc.exists) return null;
    const data = newsDoc.data() as NewsModel;
    if (!data) return null;
    const rv = await this.converyNewsModelToNewsPost(data, newsId);
    return rv;
  }

  async RecentNews(
    keyword: string,
    tags: string[],
    limit: number = 20,
    offset: number = 0
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
    const newsDocs = await newsQuery.get();
    const newsPosts: NewsPost[] = [];
    for (const doc of newsDocs.docs) {
      const data = doc.data() as NewsModel;
      if (!data) continue;
      const newsPost = await this.converyNewsModelToNewsPost(data, doc.id);
      newsPosts.push(newsPost);
    }
    return newsPosts;
  }

  private async converyNewsModelToNewsPost(
    newsModel: NewsModel,
    newsId: string
  ): Promise<NewsPost> {
    const user = await this.userService.userById(null, newsModel.userId);
    if (!user) throw new Error("User not found");
    let rv = {
      id: newsId,
      user,
//      createdAt: newsModel.created.toDate().toISOString(),
//      updatedAt: newsModel.updated.toDate().toISOString(),
      createdAt: newsModel.created.seconds * 1000,
      updatedAt: newsModel.updated.seconds * 1000,
      ...newsModel,
    } as NewsPost;
    if (newsModel.relatedItemIds && newsModel.relatedItemIds.length > 0) {
      // get related items by id
      const relatedItems = await this.itemService.itemsByIds(
        newsModel.relatedItemIds
      );
      rv.relatedItems = relatedItems;
    }
    return rv;
  }

  async createNews(
    owner: User,
    title: string,
    content: string,
    images: string[],
    relatedItemIds: string[],
    tags: string[]
  ): Promise<NewsPost> {
    if (!owner || !owner.role || owner.role !== Role.Admin) {
      throw new Error("Only admin can create news");
    }
    const now = new Timestamp(Math.ceil(Date.now() / 1000), 0);
    const newsData: NewsModel = {
      userId: owner.id,
      title: title,
      content: content,
      images: images || [],
      relatedItemIds: relatedItemIds || [],
      isVisible: true,
      tags: tags || [],
      //location: undefined,  // require to get from user service 's location
      created: now,
      updated: now,
    };
    const docRef = await db.collection("news").add(newsData);
    const rv = this.converyNewsModelToNewsPost(newsData, docRef.id);
    return rv;
  }
}
