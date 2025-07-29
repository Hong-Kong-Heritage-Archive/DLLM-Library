import { LoginUser, GenerateSignedUrlForUpload } from "./platform";
import { UserService } from "./userService";
import { ItemService } from "./itemService";
import { NewsService } from "./newsService";
import { TransactionService } from "./transactionService";
import { createMapService } from "./mapService";
import {
  Resolvers,
  Item,
  User,
  NewsPost,
  Location,
  SignedUrlResponse,
  Transaction,
  TransactionStatus,
  Category
} from "./generated/graphql";
import { GraphQLScalarType, GraphQLError } from "graphql";
import { Kind } from "graphql/language";

interface Context {
  loginUser: LoginUser | null;
}

const itemService = new ItemService();
const userService = new UserService(itemService);
const newsService = new NewsService(itemService, userService);
const transactionService = new TransactionService(itemService, userService);

export const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value) {
    // Convert outgoing Date to ISO string for JSON
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      return new Date(value).toISOString();
    }
    if (typeof value === "number") {
      return new Date(value).toISOString();
    }
    throw new GraphQLError("Value is not a valid Date: " + value);
  },
  parseValue(value) {
    // Convert incoming string to Date object
    if (typeof value === "string") {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError("Value is not a valid Date: " + value);
      }
      return date;
    }
    throw new GraphQLError("Value is not a valid Date: " + value);
  },
  parseLiteral(ast) {
    // Convert hard-coded AST string to Date object
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (isNaN(date.getTime())) {
        throw new GraphQLError("Value is not a valid Date: " + ast.value);
      }
      return date;
    }
    throw new GraphQLError(
      "Can only parse strings to Dates but got a: " + ast.kind
    );
  },
});

export const resolvers: Resolvers = {
  Date: DateScalar,
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
      __: any
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
    itemsByCategory: async (
      _: any,
      { category, status, limit = 20, offset = 0 }: any,
      { loginUser }: Context
    ): Promise<Item[]> => {
      return itemService.itemsByCategory();
    },
    item: async (_: any, { id }: any, __: any): Promise<Item | null> => {
      return itemService.itemById(id);
    },
    recentAddedItems: async (
      _: any,
      { limit = 20, offset = 0, category }: any,
      __: any
    ): Promise<Item[]> => {
      return itemService.recentAddedItems(limit, offset, category);
    },
    category: async (_: any, { categoryId }: any, __: any): Promise<Category | null> => {
      return itemService.category(categoryId);
    },
    categories: async (_: any, { limit = 20, offset = 0 }: any, __: any): Promise<Category[] | null> => {
      return itemService.categories(categoryId);
    },
    createCategory: async (_: any, { label, type }, __: any) => {
      return await itemService.createCategory(label, type);
    },
    updateCategory: async (_: any, { categoryId, label, type }, __: any) => {
      return await itemService.updateCategory(id, label, type);
    },
    user: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<User | null> => {
      return userService.userById(id);
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
    openTransactionsByItem: async (
      _: any,
      { itemId }: any,
      __: any
    ): Promise<Transaction[]> => {
      return transactionService.transactionsByItemNotStatus(itemId, [
        TransactionStatus.Completed,
        TransactionStatus.Cancelled,
      ]);
    },
    transactionsByItem: async (
      _: any,
      { itemId }: any,
      __: any
    ): Promise<Transaction[]> => {
      return transactionService.transactionsByItemNotStatus(itemId, []);
    },
    transaction: async (
      _: any,
      { id }: any,
      __: any
    ): Promise<Transaction | null> => {
      return transactionService.transactionById(id);
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
      { title, content, images, relatedItemIds, tags }: any,
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
    },
    generateSignedUrl: async (
      _: any,
      { fileName, contentType, folder }: any,
      { loginUser }: Context
    ): Promise<SignedUrlResponse> => {
      if (!loginUser) throw new Error("Not authenticated");
      const rv = await GenerateSignedUrlForUpload(
        loginUser.uid,
        fileName,
        contentType,
        folder
      );
      return {
        expires: rv.expires,
        signedUrl: rv.signedUrl,
        gsUrl: rv.gsUrl,
      };
    },
    createTransaction: async (
      _: any,
      { itemId }: any,
      { loginUser }: Context
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const requestor = await userService.me(loginUser);
      if (!requestor) throw new Error("Owner not found");
      return transactionService.createTransaction(requestor, itemId);
    },
    approveTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return transactionService.approveTransaction(owner, id);
    },
    transferTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const holder = await userService.me(loginUser);
      if (!holder) throw new Error("User not found");
      return transactionService.transferTransaction(holder, id);
    },

    receiveTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const requestor = await userService.me(loginUser);
      if (!requestor) throw new Error("User not found");
      return transactionService.receiveTransaction(requestor, id);
    },
    cancelTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.me(loginUser);
      if (!user) throw new Error("User not found");
      return transactionService.cancelTransaction(user, id);
    },
  },
};
