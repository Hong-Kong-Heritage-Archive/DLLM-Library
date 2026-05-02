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
  Role,
  CategoryMap,
  HostConfig,
  HostConfigInput,
  Bind,
  Binder,
  BinderPath,
} from "./generated/graphql";
import { GraphQLScalarType, GraphQLError } from "graphql";
import { Kind } from "graphql/language";
import { CategoryService } from "./categoryService";
import { CommentService } from "./commentService";
import { RecommendService } from "./recommendService";
import { SystemService } from "./systemService";
import { BinderService } from "./binderService";

interface Context {
  loginUser: LoginUser | null;
}

const systemService = new SystemService();
const categoryService = new CategoryService();
const itemService = new ItemService(categoryService);
const userService = new UserService(itemService, categoryService);
const newsService = new NewsService(itemService, userService);
const transactionService = new TransactionService(itemService, userService);
const commentService = new CommentService(userService);
const recommendService = new RecommendService(itemService);
const binderService = new BinderService(itemService, userService);

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
      "Can only parse strings to Dates but got a: " + ast.kind,
    );
  },
});

export const resolvers: Resolvers = {
  Date: DateScalar,
  Query: {
    hostConfig: async (_: any, __: any, ___: any): Promise<HostConfig> => {
      const config = await systemService.getHostConfig();
      return config;
    },
    me: async (
      _: any,
      __: any,
      { loginUser }: Context,
    ): Promise<User | null> => {
      return userService.me(loginUser);
    },
    items: async (
      _: any,
      {
        classifications,
        category,
        status,
        keyword,
        limit = 20,
        offset = 0,
      }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.items(
        user,
        classifications,
        category,
        status,
        keyword,
        limit,
        offset,
      );
    },
    totalItemsCount: async (
      _: any,
      { classifications, category, status, keyword }: any,
      __: any,
    ): Promise<number> => {
      return itemService.totalItemsCount(
        classifications,
        category,
        status,
        keyword,
      );
    },
    itemsByLocation: async (
      _: any,
      {
        latitude,
        longitude,
        radiusKm,
        classifications,
        category,
        status,
        keyword,
        limit = 20,
        offset = 0,
      }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.itemsByLocation(
        user,
        latitude,
        longitude,
        radiusKm,
        classifications,
        category,
        status,
        keyword,
        limit,
        offset,
      );
    },
    totalItemsCountByLocation: async (
      _: any,
      {
        latitude,
        longitude,
        radiusKm,
        classifications,
        category,
        status,
        keyword,
      }: any,
      __: any,
    ): Promise<number> => {
      return itemService.totalItemsCountByLocation(
        latitude,
        longitude,
        radiusKm,
        classifications,
        category,
        status,
        keyword,
      );
    },
    totalItemsCountByUser: async (
      _: any,
      { userId, category, status, keyword, isExchangePointItem }: any,
      __: any,
    ): Promise<number> => {
      return itemService.totalItemsCountByUser(
        userId,
        category,
        status,
        keyword,
        isExchangePointItem,
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
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const loggedInUserById = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.itemsByUser(
        loggedInUserById,
        userId,
        category,
        status,
        keyword,
        limit,
        offset,
        isExchangePointItem,
      );
    },
    itemsOnLoanByOwner: async (
      _: any,
      { userId, category, status, keyword, limit = 20, offset = 0 }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      if ( !user ) {
        throw new Error("Not authenticated");
      }

      return itemService.itemsOnLoanByOwner(
        user,
        category,
        status,
        keyword,
        limit,
        offset,
      );
    },
    itemsOnLoanByHolder: async (
      _: any,
      { userId, category, status, keyword, limit = 20, offset = 0 }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      if ( !user ) {
        throw new Error("Not authenticated");
      }

      return itemService.itemsOnLoanByHolder(
        user,
        category,
        status,
        keyword,
        limit,
        offset,
      );
    },
    item: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<Item | null> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.itemById(user, id);
    },
    duplicateTitlesByUser: async (
      _: any,
      { userId, names }: any,
      __: any,
    ): Promise<string[]> => {
      return itemService.duplicateTitlesByUser(userId, names);
    },
    recentAddedItems: async (
      _: any,
      { limit = 20, offset = 0, category }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      console.log(
        "recentAddedItems " +
          (user ? user?.visibleContentRating : "no user") +
          "/n",
      );
      return itemService.recentAddedItems(user, limit, offset, category);
    },
    user: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<User | null> => {
      return userService.userById(id);
    },
    exchangePoints: async (
      _: any,
      { limit = 20, offset = 0 }: any,
      __: any,
    ): Promise<User[]> => {
      return userService.exchangePoints(limit, offset);
    },
    exchangePointsCount: async (_: any, __: any, ___: any): Promise<number> => {
      return userService.exchangePointsCount();
    },
    newsPost: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<NewsPost | null> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return newsService.NewsById(user, id);
    },
    newsRecentPosts: async (
      _: any,
      { keyword, tags = [], limit = 10, offset = 0 }: any,
      { loginUser }: Context,
    ): Promise<NewsPost[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return newsService.RecentNews(user, keyword, tags, limit, offset);
    },
    geocodeAddress: async (
      _parent: any,
      { address }: { address: string },
      _context: Context,
      _info: any,
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
      __: any,
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(itemId, null, [
        TransactionStatus.Completed,
        TransactionStatus.Cancelled,
        TransactionStatus.Expired,
      ]);
    },
    openTransactionsByUser: async (
      _: any,
      { userId }: any,
      __: any,
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(null, userId, [
        TransactionStatus.Completed,
        TransactionStatus.Cancelled,
        TransactionStatus.Expired,
      ]);
    },
    transactionsByUser: async (
      _: any,
      { userId }: any,
      __: any,
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(null, userId, [
        TransactionStatus.Expired,
      ]);
    },
    transactionsByItem: async (
      _: any,
      { itemId }: any,
      __: any,
    ): Promise<Transaction[]> => {
      return transactionService.transactionsNotStatus(itemId, null, [
        TransactionStatus.Expired,
      ]);
    },
    transaction: async (
      _: any,
      { id }: any,
      __: any,
    ): Promise<Transaction | null> => {
      return transactionService.transactionById(id);
    },
    // Categories
    recentUpdateCategories: async (
      _: any,
      { limit = 10 }: any,
      __: any,
    ): Promise<string[]> => {
      return categoryService.getRecentUpdateCategories(limit);
    },
    hotCategories: async (
      _: any,
      { limit = 10 }: any,
      __: any,
    ): Promise<string[]> => {
      return categoryService.getHotCategories(limit);
    },
    defaultCategories: async (_: any, __: any): Promise<string[]> => {
      return categoryService.getDefaultCategories();
    },
    recommendedItems: async (
      _: any,
      { type, category, limit = 10 }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser
        ? await userService.userModelById(loginUser.uid)
        : null;
      return recommendService.recommendationItems(user, type, category, limit);
    },
    commentsByItemId: async (
      _: any,
      { itemId, first = 10, startAfterId, startAfterDate }: any,
      __: any,
    ) => {
      // Returns dummy comments for any itemId
      return commentService.commentsByItemId(
        itemId,
        first,
        startAfterId,
        startAfterDate,
      );
    },
    commentsByUserId: async (
      _: any,
      { userId, first = 10, startAfterId, startAfterDate }: any,
      __: any,
    ) => {
      // Returns dummy comments for any userId
      return commentService.commentsByUserId(
        userId,
        first,
        startAfterId,
        startAfterDate,
      );
    },
    itemConfig: async (_: any, __: any): Promise<any> => {
      const categoryMaps = await systemService.getAllCategoryMaps();
      const defaultCategoryTrees =
        await systemService.getDefaultCategoryTrees();
      return {
        defaultCategoryTrees,
        categoryMaps,
      };
    },
    recentItemsWithoutClassifications: async (
      _: any,
      { limit = 20 }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.recentItemsWithoutClassifications(limit, 0, user);
    },
    recentItemsContentRatingNotChecked: async (
      _: any,
      { limit = 20 }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.recentItemsContentRatingNotChecked(limit, 0, user);
    },
    itemsByKeywordExperimental: async (
      _: any,
      { keyword = "" }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      const user = loginUser ? await userService.userById(loginUser.uid) : null;
      return itemService.itemsByKeywordExperimental(keyword, user);
    },
    binder: async (_: any, { id }: any, __: any): Promise<Binder | null> => {
      return binderService.binder(id);
    },
    binderPathsByUser: async (
      _: any,
      { userId }: any,
      __: any,
    ): Promise<BinderPath[]> => {
      return binderService.binderPathsByUser(userId);
    },
    bindersFromItemId: async (
      _: any,
      { itemId }: any,
      __: any,
    ): Promise<Binder[] | null> => {
      return binderService.binderFromItemId(itemId);
    },
  },
  Mutation: {
    createUser: async (
      _: any,
      { nickname, address, visibleContentRating }: any,
      { loginUser }: Context,
    ): Promise<User> => {
      return userService.createUser(
        loginUser,
        nickname,
        address,
        visibleContentRating,
      );
    },
    updateUser: async (
      _: any,
      {
        nickname,
        contactMethods,
        address,
        exchangePoints,
        visibleContentRating,
      }: any,
      { loginUser }: Context,
    ): Promise<User> => {
      return userService.updateUser(
        loginUser,
        nickname,
        address,
        contactMethods,
        exchangePoints,
        visibleContentRating,
      );
    },
    createItem: async (
      _: any,
      args: any,
      { loginUser }: Context,
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
        args.deposit,
        args.isbn,
        args.contentRating,
      );
      await userService.addItemToUser(owner, newItem);
      return newItem;
    },
    createItemsFromJSON: async (
      _: any,
      { bookJson, deposit }: any,
      { loginUser }: Context,
    ): Promise<Item[]> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return itemService.createItemsFromJSON(owner, bookJson, deposit);
    },
    updateItem: async (
      _: any,
      args: any,
      { loginUser }: Context,
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
        args.deposit,
        args.classifications,
        args.isbn,
        args.contentRating,
        args.contentRatingChecked,
      );
    },
    pinItem: async (
      _: any,
      { itemId }: any,
      { loginUser }: Context,
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.userModelById(loginUser.uid);
      if (!user) throw new Error("User not found");
      return userService.pinItem(user, itemId, recommendService);
    },
    unpinItem: async (
      _: any,
      { itemId }: any,
      { loginUser }: Context,
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.userModelById(loginUser.uid);
      if (!user) throw new Error("User not found");
      return userService.unpinItem(user, itemId);
    },
    createNewsPost: async (
      _: any,
      { title, content, images, relatedItemIds, tags }: any,
      { loginUser }: Context,
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
        tags,
      );
    },
    generateSignedUrl: async (
      _: any,
      { fileName, contentType, folder }: any,
      { loginUser }: Context,
    ): Promise<SignedUrlResponse> => {
      if (!loginUser) throw new Error("Not authenticated");
      const rv = await GenerateSignedUrlForUpload(
        loginUser.uid,
        fileName,
        contentType,
        folder,
      );
      return {
        expires: rv.expires,
        signedUrl: rv.signedUrl,
        gsUrl: rv.gsUrl,
      };
    },
    createTransaction: async (
      _: any,
      { itemId, location, locationIndex, details }: any,
      { loginUser }: Context,
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const requestor = await userService.me(loginUser);
      if (!requestor) throw new Error("Owner not found");
      return transactionService.createTransaction(
        requestor,
        itemId,
        location,
        locationIndex,
        details,
      );
    },
    createQuickTransaction: async (
      _: any,
      { itemId, details }: any,
      { loginUser }: Context,
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const holder = await userService.me(loginUser);
      if (!holder) throw new Error("Holder not found");
      return transactionService.createQuickTransaction(holder, itemId, details);
    },
    approveTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return transactionService.approveTransaction(owner, id);
    },
    transferTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const holder = await userService.me(loginUser);
      if (!holder) throw new Error("User not found");
      return transactionService.transferTransaction(holder, id);
    },

    receiveTransaction: async (
      _: any,
      { id, images }: any,
      { loginUser }: Context,
    ): Promise<Transaction> => {
      if (!loginUser) throw new Error("Not authenticated");
      const requestor = await userService.me(loginUser);
      if (!requestor) throw new Error("User not found");
      return transactionService.receiveTransaction(requestor, id, images);
    },
    cancelTransaction: async (
      _: any,
      { id }: any,
      { loginUser }: Context,
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.me(loginUser);
      if (!user) throw new Error("User not found");
      return transactionService.cancelTransaction(user, id);
    },
    addItemComment: async (
      _: any,
      args: any,
      { loginUser }: Context,
    ): Promise<string> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return commentService.addItemComment(owner, args.itemId, args.content);
    },
    deleteItemComment: async (
      _: any,
      args: any,
      { loginUser }: Context,
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      const { itemId, commentId } = args;
      return commentService.deleteItemComment(owner, itemId, commentId);
    },
    editItemComment: async (
      _: any,
      args: any,
      { loginUser }: Context,
    ): Promise<boolean> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      const { itemId, commentId, content } = args;
      return commentService.editItemComment(owner, itemId, commentId, content);
    },
    upsertCategoryMap: async (
      _: any,
      { en, categoryMaps }: any,
      { loginUser }: Context,
    ): Promise<CategoryMap[]> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.me(loginUser);
      if (!user || user.role !== Role.Admin) throw new Error("Admin only");
      return systemService.upsertCategoryMap(en, categoryMaps);
    },
    addCategoryTree: async (
      _: any,
      { parentPath, leafCategory }: any,
      { loginUser }: Context,
    ): Promise<string> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.me(loginUser);
      if (!user || user.role !== Role.Admin) throw new Error("Admin only");
      return systemService.addCategoryTree(parentPath, leafCategory);
    },
    generateItemIndexIncremental: async (
      _parent: any,
      _args: any,
      _context: any,
    ): Promise<boolean> => {
      // TODO: Make this admin only.
      return itemService.generateItemIndexIncremental();
    },
    updateHostConfig: async (
      _: any,
      { input }: any,
      { loginUser }: Context,
    ): Promise<HostConfig> => {
      if (!loginUser) throw new Error("Not authenticated");
      const user = await userService.me(loginUser);
      if (!user || user.role !== Role.Admin) throw new Error("Admin only");
      return systemService.updateHostConfig(input);
    },
    addBindToBinder: async (
      _: any,
      { parentId, newBinderName, bind, beforeBindId }: any,
      { loginUser }: Context,
    ): Promise<Binder> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      let newBinder: Binder;
      if (newBinderName) {
        // Create a new Binder and bind to parent
        newBinder = await binderService.createBinder(
          owner,
          parentId,
          newBinderName,
          bind,
        );
      } else {
        // Just add bind to parent binder
        newBinder = await binderService.addBindToBinder(
          owner,
          parentId,
          beforeBindId,
          bind,
        );
      }
      return newBinder;
    },
    updateBinder: async (
      _: any,
      { id, name, description, images, bindIds }: any,
      { loginUser }: Context,
    ): Promise<Binder> => {
      if (!loginUser) throw new Error("Not authenticated");
      const owner = await userService.me(loginUser);
      if (!owner) throw new Error("Owner not found");
      return binderService.updateBinder(
        owner,
        id,
        name,
        description,
        images,
        bindIds,
      );
    },
  },
};
