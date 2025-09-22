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
} from "./generated/graphql";
import { GraphQLScalarType, GraphQLError } from "graphql";
import { Kind } from "graphql/language";
import { CategoryService } from "./categoryService";
import { CommentService } from "./commentService";

interface Context {
  loginUser: LoginUser | null;
}

const categoryService = new CategoryService();
const itemService = new ItemService(categoryService);
const userService = new UserService(itemService, categoryService);
const newsService = new NewsService(itemService, userService);
const transactionService = new TransactionService(itemService, userService);
const commentService = new CommentService(userService);

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
      {
        userId,
        category,
        status,
        keyword,
        limit = 20,
        offset = 0,
        isExchangePointItem = false,
      }: any,
      __: any
    ): Promise<Item[]> => {
      return itemService.itemsByUser(
        userId,
        category,
        status,
        keyword,
        limit,
        offset,
        isExchangePointItem
      );
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
    user: async (
      _: any,
      { id }: any,
      { loginUser }: Context
    ): Promise<User | null> => {
      return userService.userById(id);
    },
    exchangePoints: async (
      _: any,
      { limit = 20, offset = 0 }: any,
      __: any
    ): Promise<User[]> => {
      return userService.exchangePoints(limit, offset);
    },
    exchangePointsCount: async (_: any, __: any, ___: any): Promise<number> => {
      return userService.exchangePointsCount();
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
      return transactionService.transactionsNotStatus(itemId, null, [
        TransactionStatus.Completed,
        TransactionStatus.Cancelled,
      ]);
    },
    openTransactionsByUser: async (
      _: any,
      { userId }: any,
      __: any
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(null, userId, [
        TransactionStatus.Completed,
        TransactionStatus.Cancelled,
      ]);
    },
    transactionsByUser: async (
      _: any,
      { userId }: any,
      __: any
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(null, userId, []);
    },
    transactionsByItem: async (
      _: any,
      { itemId }: any,
      __: any
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(itemId, null, []);
    },
    transaction: async (
      _: any,
      { id }: any,
      __: any
    ): Promise<Transaction | null> => {
      return transactionService.transactionById(id);
    },
    // Categories
    recentUpdateCategories: async (
      _: any,
      { limit = 10 }: any,
      __: any
    ): Promise<string[]> => {
      return categoryService.getRecentUpdateCategories(limit);
    },
    hotCategories: async (
      _: any,
      { limit = 10 }: any,
      __: any
    ): Promise<string[]> => {
      return categoryService.getHotCategories(limit);
    },
    defaultCategories: async (_: any, __: any): Promise<string[]> => {
      return categoryService.getDefaultCategories();
    },
    commentsByItemId: async (
      _: any,
      { itemId, first = 10, startAfterId, startAfterDate }: any,
      __: any
    ) => {
      // Returns dummy comments for any itemId
      return commentService.commentsByItemId(
        itemId,
        first,
        startAfterId,
        startAfterDate
      );
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
      { nickname, contactMethods, address, exchangePoints }: any,
      { loginUser }: Context
    ): Promise<User> => {
      return userService.updateUser(
        loginUser,
        nickname,
        address,
        contactMethods,
        exchangePoints
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
      const newItem = await itemService.createItem(
        owner,
        args.name,
        args.description,
        args.condition,
        args.category,
        args.status,
        args.images,
        args.publishedYear,
        args.language,
        args.deposite
      );
      await userService.addItemToUser(owner, newItem);
      return newItem;
    },
    updateItem: async (
      _: any,
      args: any,
      { loginUser }: Context
    ): Promise<Item> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return itemService.updateItem(
        args.id,
        owner,
        args.name,
        args.condition,
        args.category,
        args.status,
        args.publishedYear,
        args.language,
        args.description,
        args.images,
        args.deposite
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
      { itemId, location, locationIndex }: any,
      { loginUser }: Context
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const requestor = await userService.me(loginUser);
      if (!requestor) throw new Error("Owner not found");
      return transactionService.createTransaction(
        requestor,
        itemId,
        location,
        locationIndex
      );
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
    addItemComment: async (
      _: any,
      args: any,
      { loginUser }: Context
    ): Promise<string> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return commentService.addItemComment(owner, args.itemId, args.content);
    },
    deleteItemComment: async (
      _: any,
      args: any,
      { loginUser }: Context
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      const { itemId, commentId } = args;
      return commentService.deleteItemComment(owner, itemId, commentId);
    },
  },
};
