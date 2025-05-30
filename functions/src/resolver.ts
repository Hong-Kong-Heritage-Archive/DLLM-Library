import { LoginUser } from "./platform";
import { UserService } from "./userService";
import { ItemService } from "./itemService";
import { NewsService } from "./newsService";
import { createMapService } from "./mapService";
import {
  Resolvers,
  Item,
  User,
  NewsPost,
  Location,
} from "./generated/graphql";


interface Context {
  loginUser: LoginUser | null;
}

const itemService = new ItemService();
const userService = new UserService(itemService);
const newsService = new NewsService(itemService, userService);

export const resolvers: Resolvers = {
  Query: {
    me: async (
      _: any,
      __: any,
      { loginUser }: Context
    ): Promise<User | null> => {
      return userService.me(loginUser);
    },
    itemsByLocation: async (
      _: any,
      {
        latitude,
        longitude,
        radiusKm,
        category,
        status,
        keyword,
        limit = 20,
        offset = 0,
      }: any,
      __ : any
    ): Promise<Item[]> => {
      return itemService.itemsByLocation(
        latitude,
        longitude,
        radiusKm,
        category,
        status,
        keyword,
        limit,
        offset
      );
    },
    itemsByUser: async (
      _: any,
      { userId, category, status, keyword, limit = 20, offset = 0 }: any,
      __: any
    ): Promise<Item[]> => {
      return itemService.itemsByUser(
        userId,
        category,
        status,
        keyword,
        limit,
        offset
      );
    },
    item: async (
      _: any,
      { id }: any,
      __: any
    ): Promise<Item | null> => {
      return itemService.itemById(id);
    },
    user: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<User | null> => {
      return userService.userById(loginUser, id);
    },
    newsPost: async (
      _: any,
      { id }: any,
      __: any
    ): Promise<NewsPost | null> => {
      return newsService.NewsById(id);
    },
    newsRecentPosts: async (
      _: any,
      { keyword, tags = [], limit = 10, offset = 0 }: any,
      __: any
    ): Promise<NewsPost[]> => {
      return newsService.RecentNews(keyword, tags, limit, offset);
    },
    geocodeAddress: async (
      _parent: any,
      { address }: { address: string },
      _context: Context,
      _info: any
    ): Promise<Location | null> => {
      if (!address || address.trim() === "") {
        console.warn("geocodeAddress called with empty address.");
        throw new Error("geocodeAddress called with empty address.");
      }
      const mapService = createMapService();
      return await mapService.resolveLocationAndGeohash(address);
    },
  },
  Mutation: {
    createUser: async (
      _: any,
      { nickname, address }: any,
      { loginUser }: Context
    ): Promise<User> => {
      return userService.createUser(loginUser, nickname, address);
    },
    updateUser: async (
      _: any,
      { nickname, contactMethods, address }: any,
      { loginUser }: Context
    ): Promise<User> => {
      return userService.updateUser(
        loginUser,
        nickname,
        address,
        contactMethods
      );
    },
    createItem: async (
      _: any,
      args: any,
      { loginUser }: Context
    ): Promise<Item> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return itemService.createItem(
        owner,
        args.name,
        args.description,
        args.condition,
        args.category,
        args.status,
        args.images,
        args.publishedYear,
        args.language
      );
    },
    createNewsPost: async (
      _: any,
      {
        title,
        content,
        images,
        relatedItemIds,
        tags,
      }: any,
      { loginUser }: Context
    ): Promise<NewsPost> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return newsService.createNews(
        owner,
        title,
        content,
        images,
        relatedItemIds,
        tags
      );
    }
  },
};
