import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  Void: { input: any; output: any; }
};

export type Bind = {
  __typename?: 'Bind';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  type: BindType;
};

export type BindInput = {
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  type: BindType;
};

export enum BindType {
  Binder = 'BINDER',
  Item = 'ITEM'
}

export type Binder = {
  __typename?: 'Binder';
  bindedCount: Scalars['Int']['output'];
  binds: Array<Bind>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  owner: User;
  thumbnails?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['Date']['output'];
};

export type BinderPath = {
  __typename?: 'BinderPath';
  id: Scalars['ID']['output'];
  path: Scalars['String']['output'];
};

export type Category = {
  __typename?: 'Category';
  category: Scalars['String']['output'];
  count: Scalars['Int']['output'];
};

export type CategoryMap = {
  __typename?: 'CategoryMap';
  language: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type CategoryMapInput = {
  language: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type ContactMethod = {
  __typename?: 'ContactMethod';
  isPublic: Scalars['Boolean']['output'];
  type: ContactMethodType;
  value: Scalars['String']['output'];
};

export type ContactMethodInput = {
  isPublic: Scalars['Boolean']['input'];
  type: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export enum ContactMethodType {
  Email = 'EMAIL',
  Signal = 'SIGNAL',
  Telegram = 'TELEGRAM',
  Whatsapp = 'WHATSAPP'
}

export type HostConfig = {
  __typename?: 'HostConfig';
  aboutUsText: Scalars['String']['output'];
  chatLink: Scalars['String']['output'];
  itemShareMessageTemplates: Array<Scalars['String']['output']>;
  splashScreenImageUrl?: Maybe<Scalars['String']['output']>;
  splashScreenText?: Maybe<Scalars['String']['output']>;
};

export type HostConfigInput = {
  aboutUsText: Scalars['String']['input'];
  chatLink: Scalars['String']['input'];
  itemShareMessageTemplates: Array<Scalars['String']['input']>;
  splashScreenImageUrl?: InputMaybe<Scalars['String']['input']>;
  splashScreenText: Scalars['String']['input'];
};

export type Item = {
  __typename?: 'Item';
  category: Array<Scalars['String']['output']>;
  clssfctns?: Maybe<Array<Scalars['String']['output']>>;
  condition: ItemCondition;
  contentRating: Scalars['Int']['output'];
  contentRatingChecked: Scalars['Boolean']['output'];
  createdAt: Scalars['Date']['output'];
  deposit?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  holderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  isbn?: Maybe<Scalars['String']['output']>;
  language: Language;
  location?: Maybe<Location>;
  name: Scalars['String']['output'];
  ownerId: Scalars['ID']['output'];
  publishedYear?: Maybe<Scalars['Int']['output']>;
  status: ItemStatus;
  thumbnails?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['Date']['output'];
};

export type ItemComment = ItemCommentBase & {
  __typename?: 'ItemComment';
  content: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['Date']['output'];
  userId: Scalars['ID']['output'];
  userNickname: Scalars['String']['output'];
};

export type ItemCommentBase = {
  content: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type ItemCommentByUser = ItemCommentBase & {
  __typename?: 'ItemCommentByUser';
  commentId: Scalars['ID']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  itemId: Scalars['ID']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type ItemCommentPageInfo = {
  __typename?: 'ItemCommentPageInfo';
  endCursor?: Maybe<Scalars['ID']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['ID']['output']>;
};

export type ItemCommentsByUserConnection = {
  __typename?: 'ItemCommentsByUserConnection';
  comments?: Maybe<Array<Maybe<ItemCommentByUser>>>;
  pageInfo?: Maybe<ItemCommentPageInfo>;
};

export type ItemCommentsConnection = {
  __typename?: 'ItemCommentsConnection';
  comments?: Maybe<Array<Maybe<ItemComment>>>;
  pageInfo?: Maybe<ItemCommentPageInfo>;
};

export enum ItemCondition {
  Fair = 'FAIR',
  Good = 'GOOD',
  LikeNew = 'LIKE_NEW',
  New = 'NEW',
  Poor = 'POOR'
}

export type ItemConfig = {
  __typename?: 'ItemConfig';
  categoryMaps: Array<Array<CategoryMap>>;
  defaultCategoryTrees: Array<Scalars['String']['output']>;
};

export enum ItemStatus {
  Available = 'AVAILABLE',
  Exchangeable = 'EXCHANGEABLE',
  Gift = 'GIFT',
  Reserved = 'RESERVED',
  Transferred = 'TRANSFERRED'
}

export enum Language {
  En = 'EN',
  ZhHk = 'ZH_HK'
}

export type Location = {
  __typename?: 'Location';
  geohash?: Maybe<Scalars['String']['output']>;
  latitude: Scalars['Float']['output'];
  longitude: Scalars['Float']['output'];
};

export type LocationInput = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBindToBinder: Binder;
  addCategoryTree: Scalars['String']['output'];
  addItemComment: Scalars['ID']['output'];
  approveTransaction: Transaction;
  cancelTransaction: Scalars['Boolean']['output'];
  createItem: Item;
  createItemsFromJSON: Array<Item>;
  createNewsPost: NewsPost;
  createQuickTransaction: Transaction;
  createTransaction: Transaction;
  createUser: User;
  deleteCategoryTree: Scalars['Boolean']['output'];
  deleteItem: Scalars['Boolean']['output'];
  deleteItemComment: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  editItemComment: Scalars['Boolean']['output'];
  generateItemIndexIncremental: Scalars['Boolean']['output'];
  generateSignedUrl: SignedUrlResponse;
  hideNewsPost: Scalars['Boolean']['output'];
  pinItem: Scalars['Boolean']['output'];
  receiveTransaction: Transaction;
  removeBindFromBinder: Binder;
  transferTransaction: Transaction;
  unpinItem: Scalars['Boolean']['output'];
  updateBindInBinder: Binder;
  updateBinder: Binder;
  updateHostConfig: HostConfig;
  updateItem: Item;
  updateNewsPost: NewsPost;
  updateUser: User;
  upsertCategoryMap?: Maybe<Array<CategoryMap>>;
};


export type MutationAddBindToBinderArgs = {
  beforeBindId?: InputMaybe<Scalars['ID']['input']>;
  bind: BindInput;
  newBinderName?: InputMaybe<Scalars['String']['input']>;
  parentId: Scalars['ID']['input'];
};


export type MutationAddCategoryTreeArgs = {
  leafCategory: Scalars['String']['input'];
  parentPath?: InputMaybe<Scalars['String']['input']>;
};


export type MutationAddItemCommentArgs = {
  content: Scalars['String']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationApproveTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCancelTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateItemArgs = {
  category: Array<Scalars['String']['input']>;
  condition: ItemCondition;
  contentRating?: InputMaybe<Scalars['Int']['input']>;
  deposit?: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  isbn?: InputMaybe<Scalars['String']['input']>;
  language: Language;
  name: Scalars['String']['input'];
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status: ItemStatus;
};


export type MutationCreateItemsFromJsonArgs = {
  bookJson: Array<Scalars['String']['input']>;
  deposit?: Scalars['Int']['input'];
};


export type MutationCreateNewsPostArgs = {
  content: Scalars['String']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  relatedItemIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};


export type MutationCreateQuickTransactionArgs = {
  details?: InputMaybe<Scalars['String']['input']>;
  itemId: Scalars['ID']['input'];
};


export type MutationCreateTransactionArgs = {
  details?: InputMaybe<Scalars['String']['input']>;
  itemId: Scalars['ID']['input'];
  location?: TransactionLocation;
  locationIndex?: Scalars['Int']['input'];
};


export type MutationCreateUserArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
  visibleContentRating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationDeleteCategoryTreeArgs = {
  categoryPath: Scalars['String']['input'];
};


export type MutationDeleteItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteItemCommentArgs = {
  commentId: Scalars['ID']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEditItemCommentArgs = {
  commentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationGenerateSignedUrlArgs = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
};


export type MutationHideNewsPostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationPinItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationReceiveTransactionArgs = {
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type MutationRemoveBindFromBinderArgs = {
  bindId: Scalars['ID']['input'];
  parentId: Scalars['ID']['input'];
};


export type MutationTransferTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnpinItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type MutationUpdateBindInBinderArgs = {
  bindId: Scalars['ID']['input'];
  newBind: BindInput;
  parentId: Scalars['ID']['input'];
};


export type MutationUpdateBinderArgs = {
  bindIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateHostConfigArgs = {
  input: HostConfigInput;
};


export type MutationUpdateItemArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  condition?: InputMaybe<ItemCondition>;
  contentRating?: InputMaybe<Scalars['Int']['input']>;
  contentRatingChecked?: InputMaybe<Scalars['Boolean']['input']>;
  deposit?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  isbn?: InputMaybe<Scalars['String']['input']>;
  language?: InputMaybe<Language>;
  name?: InputMaybe<Scalars['String']['input']>;
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
};


export type MutationUpdateNewsPostArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  relatedItemIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  contactMethods?: InputMaybe<Array<ContactMethodInput>>;
  exchangePoints?: InputMaybe<Array<Scalars['String']['input']>>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  visibleContentRating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationUpsertCategoryMapArgs = {
  categoryMaps: Array<CategoryMapInput>;
  en: Scalars['String']['input'];
};

export type NewsPost = {
  __typename?: 'NewsPost';
  content: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  isVisible: Scalars['Boolean']['output'];
  relatedItems?: Maybe<Array<Item>>;
  tags?: Maybe<Array<Scalars['String']['output']>>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  user: User;
};

export type Query = {
  __typename?: 'Query';
  binder?: Maybe<Binder>;
  binderPathsByUser: Array<BinderPath>;
  bindersFromItemId?: Maybe<Array<Binder>>;
  commentsByItemId: ItemCommentsConnection;
  commentsByUserId: ItemCommentsByUserConnection;
  defaultCategories: Array<Scalars['String']['output']>;
  duplicateTitlesByUser: Array<Scalars['String']['output']>;
  exchangePoints: Array<User>;
  exchangePointsCount: Scalars['Int']['output'];
  geocodeAddress?: Maybe<Location>;
  hostConfig: HostConfig;
  hotCategories: Array<Scalars['String']['output']>;
  item?: Maybe<Item>;
  itemConfig: ItemConfig;
  items: Array<Item>;
  itemsByKeywordExperimental: Array<Item>;
  itemsByLocation: Array<Item>;
  itemsByUser: Array<Item>;
  itemsOnLoanByHolder: Array<Item>;
  itemsOnLoanByOwner: Array<Item>;
  itemsOnLoanByUser: Array<Item>;
  me?: Maybe<User>;
  newsPost?: Maybe<NewsPost>;
  newsRecentPosts: Array<NewsPost>;
  openTransactionsByItem: Array<Transaction>;
  openTransactionsByUser: Array<Transaction>;
  recentAddedItems: Array<Item>;
  recentItemsWithoutClassifications?: Maybe<Array<Item>>;
  recentUpdateCategories: Array<Scalars['String']['output']>;
  recommendedItems: Array<Item>;
  totalItemsCount: Scalars['Int']['output'];
  totalItemsCountByLocation: Scalars['Int']['output'];
  totalItemsCountByUser: Scalars['Int']['output'];
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  transactionsByItem: Array<Transaction>;
  transactionsByUser: Array<Transaction>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryBinderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBinderPathsByUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryBindersFromItemIdArgs = {
  itemId: Scalars['ID']['input'];
};


export type QueryCommentsByItemIdArgs = {
  first: Scalars['Int']['input'];
  itemId: Scalars['ID']['input'];
  startAfterDate?: InputMaybe<Scalars['Date']['input']>;
  startAfterId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryCommentsByUserIdArgs = {
  first: Scalars['Int']['input'];
  startAfterDate?: InputMaybe<Scalars['Date']['input']>;
  startAfterId?: InputMaybe<Scalars['ID']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryDuplicateTitlesByUserArgs = {
  names: Array<Scalars['String']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryExchangePointsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGeocodeAddressArgs = {
  address: Scalars['String']['input'];
};


export type QueryHotCategoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryItemsArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
};


export type QueryItemsByKeywordExperimentalArgs = {
  keyword?: InputMaybe<Scalars['String']['input']>;
};


export type QueryItemsByLocationArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  latitude: Scalars['Float']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  longitude: Scalars['Float']['input'];
  offset?: InputMaybe<Scalars['Int']['input']>;
  radiusKm: Scalars['Float']['input'];
  status?: InputMaybe<ItemStatus>;
};


export type QueryItemsByUserArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  isExchangePointItem?: InputMaybe<Scalars['Boolean']['input']>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
  userId: Scalars['ID']['input'];
};


export type QueryItemsOnLoanByHolderArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
  userId: Scalars['ID']['input'];
};


export type QueryItemsOnLoanByOwnerArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
  userId: Scalars['ID']['input'];
};


export type QueryItemsOnLoanByUserArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
  userId: Scalars['ID']['input'];
};


export type QueryNewsPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryNewsRecentPostsArgs = {
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryOpenTransactionsByItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type QueryOpenTransactionsByUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryRecentAddedItemsArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentItemsWithoutClassificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecentUpdateCategoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecommendedItemsArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  type: RecommendationType;
};


export type QueryTotalItemsCountArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ItemStatus>;
};


export type QueryTotalItemsCountByLocationArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  classifications?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm: Scalars['Float']['input'];
  status?: InputMaybe<ItemStatus>;
};


export type QueryTotalItemsCountByUserArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  isExchangePointItem?: InputMaybe<Scalars['Boolean']['input']>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<ItemStatus>;
  userId: Scalars['ID']['input'];
};


export type QueryTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTransactionsArgs = {
  itemId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryTransactionsByItemArgs = {
  itemId: Scalars['ID']['input'];
};


export type QueryTransactionsByUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export enum RecommendationType {
  AdminPicked = 'ADMIN_PICKED',
  NewArrivals = 'NEW_ARRIVALS',
  Popular = 'POPULAR',
  UserPicked = 'USER_PICKED'
}

export enum Role {
  Admin = 'ADMIN',
  ExchangePointAdmin = 'EXCHANGE_POINT_ADMIN',
  Moderator = 'MODERATOR',
  User = 'USER'
}

export type SignedUrlResponse = {
  __typename?: 'SignedUrlResponse';
  expires: Scalars['Float']['output'];
  gsUrl: Scalars['String']['output'];
  signedUrl: Scalars['String']['output'];
};

export type Transaction = {
  __typename?: 'Transaction';
  createdAt: Scalars['Date']['output'];
  details?: Maybe<Scalars['String']['output']>;
  expireAt?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  item: Item;
  location?: Maybe<Location>;
  receiver?: Maybe<User>;
  requestor: User;
  status: TransactionStatus;
  thumbnails?: Maybe<Array<Scalars['String']['output']>>;
  updatedAt: Scalars['Date']['output'];
};

export enum TransactionLocation {
  FaceToFace = 'FACE_TO_FACE',
  HolderLocation = 'HOLDER_LOCATION',
  HolderPublicExchangePoint = 'HOLDER_PUBLIC_EXCHANGE_POINT',
  RequestorLocation = 'REQUESTOR_LOCATION',
  RequestorPublicExchangePoint = 'REQUESTOR_PUBLIC_EXCHANGE_POINT'
}

export enum TransactionStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Expired = 'EXPIRED',
  Pending = 'PENDING',
  Transfered = 'TRANSFERED'
}

export type User = {
  __typename?: 'User';
  address?: Maybe<Scalars['String']['output']>;
  contactMethods?: Maybe<Array<ContactMethod>>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  exchangePoints?: Maybe<Array<Scalars['String']['output']>>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  itemCategory?: Maybe<Array<Category>>;
  location?: Maybe<Location>;
  nickname?: Maybe<Scalars['String']['output']>;
  pinItems?: Maybe<Array<Item>>;
  role: Role;
  visibleContentRating: Scalars['Int']['output'];
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', address?: string | null, createdAt: any, email: string, id: string, isVerified: boolean, isActive: boolean, role: Role, exchangePoints?: Array<string> | null, nickname?: string | null, visibleContentRating: number, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type HostConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type HostConfigQuery = { __typename?: 'Query', hostConfig: { __typename?: 'HostConfig', aboutUsText: string, chatLink: string, splashScreenImageUrl?: string | null, splashScreenText?: string | null, itemShareMessageTemplates: Array<string> } };

export type BinderPathsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type BinderPathsByUserQuery = { __typename?: 'Query', binderPathsByUser: Array<{ __typename?: 'BinderPath', id: string, path: string }> };

export type AddBindToBinderMutationVariables = Exact<{
  parentId: Scalars['ID']['input'];
  newBinderName?: InputMaybe<Scalars['String']['input']>;
  bind: BindInput;
  beforeBindId?: InputMaybe<Scalars['ID']['input']>;
}>;


export type AddBindToBinderMutation = { __typename?: 'Mutation', addBindToBinder: { __typename?: 'Binder', id: string, name: string, updatedAt: any, binds: Array<{ __typename?: 'Bind', id: string, type: BindType, name: string }> } };

export type BinderDetailQueryVariables = Exact<{
  binderId: Scalars['ID']['input'];
}>;


export type BinderDetailQuery = { __typename?: 'Query', binder?: { __typename?: 'Binder', id: string, name: string, description?: string | null, images?: Array<string> | null, thumbnails?: Array<string> | null, bindedCount: number, updatedAt: any, binds: Array<{ __typename?: 'Bind', type: BindType, id: string, name: string }>, owner: { __typename?: 'User', id: string, nickname?: string | null, email: string } } | null };

export type UpdateBinderMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  bindIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
}>;


export type UpdateBinderMutation = { __typename?: 'Mutation', updateBinder: { __typename?: 'Binder', id: string, name: string, description?: string | null, images?: Array<string> | null, thumbnails?: Array<string> | null, bindedCount: number, updatedAt: any, binds: Array<{ __typename?: 'Bind', type: BindType, id: string, name: string }>, owner: { __typename?: 'User', id: string, nickname?: string | null, email: string } } };

export type RecentItemsWithoutClassificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RecentItemsWithoutClassificationsQuery = { __typename?: 'Query', recentItemsWithoutClassifications?: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, category: Array<string>, updatedAt: any, images?: Array<string> | null, thumbnails?: Array<string> | null, condition: ItemCondition, status: ItemStatus, language: Language, publishedYear?: number | null, clssfctns?: Array<string> | null }> | null };

export type UpdateItemClassificationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  classifications?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type UpdateItemClassificationMutation = { __typename?: 'Mutation', updateItem: { __typename?: 'Item', id: string, clssfctns?: Array<string> | null } };

export type GetItemConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetItemConfigQuery = { __typename?: 'Query', itemConfig: { __typename?: 'ItemConfig', defaultCategoryTrees: Array<string>, categoryMaps: Array<Array<{ __typename?: 'CategoryMap', language: string, value: string }>> } };

export type UpsertCategoryMapMutationVariables = Exact<{
  en: Scalars['String']['input'];
  categoryMaps: Array<CategoryMapInput> | CategoryMapInput;
}>;


export type UpsertCategoryMapMutation = { __typename?: 'Mutation', upsertCategoryMap?: Array<{ __typename?: 'CategoryMap', language: string, value: string }> | null };

export type AddCategoryTreeMutationVariables = Exact<{
  parentPath?: InputMaybe<Scalars['String']['input']>;
  leafCategory: Scalars['String']['input'];
}>;


export type AddCategoryTreeMutation = { __typename?: 'Mutation', addCategoryTree: string };

export type PendingContentRatingItemsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type PendingContentRatingItemsQuery = { __typename?: 'Query', recentItemsWithoutClassifications?: Array<{ __typename?: 'Item', id: string, name: string, category: Array<string>, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, contentRating: number, contentRatingChecked: boolean, ownerId: string }> | null };

export type ApproveContentRatingMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  contentRatingChecked?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ApproveContentRatingMutation = { __typename?: 'Mutation', updateItem: { __typename?: 'Item', id: string, contentRating: number, contentRatingChecked: boolean } };

export type AddItemCommentMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
}>;


export type AddItemCommentMutation = { __typename?: 'Mutation', addItemComment: string };

export type GetItemCommentsQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
  first: Scalars['Int']['input'];
}>;


export type GetItemCommentsQuery = { __typename?: 'Query', commentsByItemId: { __typename?: 'ItemCommentsConnection', comments?: Array<{ __typename?: 'ItemComment', id: string, content: string, createdAt: any, userId: string, userNickname: string } | null> | null, pageInfo?: { __typename?: 'ItemCommentPageInfo', hasNextPage: boolean, endCursor?: string | null } | null } };

export type ItemQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type ItemQuery = { __typename?: 'Query', item?: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, clssfctns?: Array<string> | null, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, holderId?: string | null, deposit?: number | null, isbn?: string | null, contentRating: number, contentRatingChecked: boolean } | null };

export type UpdateItemCheckedMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  contentRatingChecked?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateItemCheckedMutation = { __typename?: 'Mutation', updateItem: { __typename?: 'Item', id: string, contentRating: number, contentRatingChecked: boolean } };

export type CreateTransactionMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
  location: TransactionLocation;
  locationIndex?: InputMaybe<Scalars['Int']['input']>;
  details: Scalars['String']['input'];
}>;


export type CreateTransactionMutation = { __typename?: 'Mutation', createTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any } };

export type CreateQuickTransactionMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
  details: Scalars['String']['input'];
}>;


export type CreateQuickTransactionMutation = { __typename?: 'Mutation', createQuickTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any } };

export type GetUserForItemQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserForItemQuery = { __typename?: 'Query', user?: { __typename?: 'User', createdAt: any, email: string, id: string, nickname?: string | null, address?: string | null, exchangePoints?: Array<string> | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: ContactMethodType, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null, pinItems?: Array<{ __typename?: 'Item', id: string }> | null } | null };

export type OpenTransactionsByItemQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type OpenTransactionsByItemQuery = { __typename?: 'Query', openTransactionsByItem: Array<{ __typename?: 'Transaction', id: string, details?: string | null, status: TransactionStatus, createdAt: any, updatedAt: any, requestor: { __typename?: 'User', id: string, nickname?: string | null, email: string } }> };

export type PinItemMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type PinItemMutation = { __typename?: 'Mutation', pinItem: boolean };

export type UnpinItemMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type UnpinItemMutation = { __typename?: 'Mutation', unpinItem: boolean };

export type BindersFromItemIdQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type BindersFromItemIdQuery = { __typename?: 'Query', bindersFromItemId?: Array<{ __typename?: 'Binder', id: string, name: string, description?: string | null, images?: Array<string> | null, thumbnails?: Array<string> | null, bindedCount: number, updatedAt: any, binds: Array<{ __typename?: 'Bind', type: BindType, id: string, name: string }>, owner: { __typename?: 'User', id: string, nickname?: string | null, email: string } }> | null };

export type CreateItemMutationVariables = Exact<{
  name: Scalars['String']['input'];
  category: Array<Scalars['String']['input']> | Scalars['String']['input'];
  condition: ItemCondition;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  language: Language;
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status: ItemStatus;
  deposit?: InputMaybe<Scalars['Int']['input']>;
  contentRating?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CreateItemMutation = { __typename?: 'Mutation', createItem: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, updatedAt: any, deposit?: number | null, contentRating: number, contentRatingChecked: boolean } };

export type UpdateItemMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  classifications?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  condition?: InputMaybe<ItemCondition>;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  language?: InputMaybe<Language>;
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
  deposit?: InputMaybe<Scalars['Int']['input']>;
  contentRating?: InputMaybe<Scalars['Int']['input']>;
  contentRatingChecked?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type UpdateItemMutation = { __typename?: 'Mutation', updateItem: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, updatedAt: any, deposit?: number | null, contentRating: number, contentRatingChecked: boolean } };

export type GetUserOpenTransactionsForCountQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserOpenTransactionsForCountQuery = { __typename?: 'Query', openTransactionsByUser: Array<{ __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, item: { __typename?: 'Item', id: string, name: string } }> };

export type NewsPostQueryVariables = Exact<{
  newsPostId: Scalars['ID']['input'];
}>;


export type NewsPostQuery = { __typename?: 'Query', newsPost?: { __typename?: 'NewsPost', id: string, title: string, content: string, images?: Array<string> | null, createdAt: any, updatedAt: any, tags?: Array<string> | null, relatedItems?: Array<{ __typename?: 'Item', id: string, name: string, category: Array<string>, status: ItemStatus }> | null, user: { __typename?: 'User', id: string, nickname?: string | null } } | null };

export type CreateNewsPostMutationVariables = Exact<{
  title: Scalars['String']['input'];
  content: Scalars['String']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  relatedItemIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type CreateNewsPostMutation = { __typename?: 'Mutation', createNewsPost: { __typename?: 'NewsPost', id: string, title: string, content: string, images?: Array<string> | null, createdAt: any, updatedAt: any, relatedItems?: Array<{ __typename?: 'Item', id: string, name: string, thumbnails?: Array<string> | null, images?: Array<string> | null }> | null } };

export type UpdateNewsPostMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  content?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  relatedItemIds?: InputMaybe<Array<Scalars['ID']['input']> | Scalars['ID']['input']>;
  tags?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type UpdateNewsPostMutation = { __typename?: 'Mutation', updateNewsPost: { __typename?: 'NewsPost', id: string, title: string, content: string, images?: Array<string> | null, isVisible: boolean, updatedAt: any, relatedItems?: Array<{ __typename?: 'Item', id: string, name: string, thumbnails?: Array<string> | null, images?: Array<string> | null }> | null } };

export type RecentItemsQueryVariables = Exact<{
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RecentItemsQuery = { __typename?: 'Query', recentAddedItems: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any }> };

export type RecommendedItemsForBannerQueryVariables = Exact<{
  type: RecommendationType;
  limit: Scalars['Int']['input'];
}>;


export type RecommendedItemsForBannerQuery = { __typename?: 'Query', recommendedItems: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any }> };

export type NewsRecentPostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NewsRecentPostsQuery = { __typename?: 'Query', newsRecentPosts: Array<{ __typename?: 'NewsPost', id: string, title: string, images?: Array<string> | null, createdAt: any, tags?: Array<string> | null }> };

export type GetTransactionQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetTransactionQuery = { __typename?: 'Query', transaction?: { __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any, details?: string | null, images?: Array<string> | null, item: { __typename?: 'Item', id: string, name: string, description?: string | null, images?: Array<string> | null, thumbnails?: Array<string> | null, condition: ItemCondition, category: Array<string>, ownerId: string, holderId?: string | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }, requestor: { __typename?: 'User', id: string, nickname?: string | null, email: string, role: Role, address?: string | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: ContactMethodType, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }, receiver?: { __typename?: 'User', id: string, nickname?: string | null, email: string, role: Role, address?: string | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: ContactMethodType, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type ApproveTransactionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveTransactionMutation = { __typename?: 'Mutation', approveTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any } };

export type TransferTransactionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type TransferTransactionMutation = { __typename?: 'Mutation', transferTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any } };

export type ReceiveTransactionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type ReceiveTransactionMutation = { __typename?: 'Mutation', receiveTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any, images?: Array<string> | null } };

export type CancelTransactionMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type CancelTransactionMutation = { __typename?: 'Mutation', cancelTransaction: boolean };

export type ItemsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  isExchangePointItem?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type ItemsByUserQuery = { __typename?: 'Query', itemsByUser: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, category: Array<string>, publishedYear?: number | null, language: Language, createdAt: any, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> };

export type TotalItemsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  isExchangePointItem?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type TotalItemsByUserQuery = { __typename?: 'Query', totalItemsCountByUser: number };

export type UserRootBinderQueryVariables = Exact<{
  binderId: Scalars['ID']['input'];
}>;


export type UserRootBinderQuery = { __typename?: 'Query', binder?: { __typename?: 'Binder', id: string, name: string, description?: string | null, images?: Array<string> | null, thumbnails?: Array<string> | null, bindedCount: number, updatedAt: any, binds: Array<{ __typename?: 'Bind', type: BindType, id: string, name: string }>, owner: { __typename?: 'User', id: string, nickname?: string | null, email: string } } | null };

export type GeocodeAddressQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GeocodeAddressQuery = { __typename?: 'Query', geocodeAddress?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null };

export type UserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserQuery = { __typename?: 'Query', user?: { __typename?: 'User', createdAt: any, email: string, id: string, nickname?: string | null, address?: string | null, isVerified: boolean, isActive: boolean, role: Role, exchangePoints?: Array<string> | null, visibleContentRating: number, itemCategory?: Array<{ __typename?: 'Category', category: string, count: number }> | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: ContactMethodType, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null, pinItems?: Array<{ __typename?: 'Item', id: string, name: string, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, category: Array<string>, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> | null } | null };

export type UpdateUserMutationVariables = Exact<{
  address?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  exchangePoints?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  contactMethods?: InputMaybe<Array<ContactMethodInput> | ContactMethodInput>;
  visibleContentRating?: InputMaybe<Scalars['Int']['input']>;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, address?: string | null, nickname?: string | null, createdAt: any, isVerified: boolean, isActive: boolean, exchangePoints?: Array<string> | null, visibleContentRating: number, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: ContactMethodType, value: string, isPublic: boolean }> | null } };

export type GetExchangePointsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetExchangePointsQuery = { __typename?: 'Query', exchangePoints: Array<{ __typename?: 'User', id: string, nickname?: string | null, address?: string | null, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null }> };

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  visibleContentRating?: InputMaybe<Scalars['Int']['input']>;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, email: string, address?: string | null, nickname?: string | null, createdAt: any, isVerified: boolean, isActive: boolean, visibleContentRating: number, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null } };

export type GetOnLoanItemsByHolderQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOnLoanItemsByHolderQuery = { __typename?: 'Query', itemsOnLoanByHolder: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, images?: Array<string> | null, updatedAt: any, createdAt: any, ownerId: string, holderId?: string | null, status: ItemStatus, deposit?: number | null }> };

export type GetUserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetUserQuery = { __typename?: 'Query', user?: { __typename?: 'User', id: string, nickname?: string | null, email: string } | null };

export type GetExchangePointsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetExchangePointsCountQuery = { __typename?: 'Query', exchangePointsCount: number };

export type DuplicateTitlesByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  names: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type DuplicateTitlesByUserQuery = { __typename?: 'Query', duplicateTitlesByUser: Array<string> };

export type CreateItemsFromJsonMutationVariables = Exact<{
  bookJson: Array<Scalars['String']['input']> | Scalars['String']['input'];
  deposit?: Scalars['Int']['input'];
}>;


export type CreateItemsFromJsonMutation = { __typename?: 'Mutation', createItemsFromJSON: Array<{ __typename?: 'Item', id: string, name: string }> };

export type RecentCategoriesQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
}>;


export type RecentCategoriesQuery = { __typename?: 'Query', recentUpdateCategories: Array<string> };

export type HotCategoriesQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
}>;


export type HotCategoriesQuery = { __typename?: 'Query', hotCategories: Array<string> };

export type RecommendedItemsQueryVariables = Exact<{
  type: RecommendationType;
  limit: Scalars['Int']['input'];
}>;


export type RecommendedItemsQuery = { __typename?: 'Query', recommendedItems: Array<{ __typename?: 'Item', id: string, name: string, category: Array<string>, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, condition: ItemCondition, ownerId: string, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> };

export type ItemsByLocationQueryVariables = Exact<{
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm: Scalars['Float']['input'];
  classifications?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ItemsByLocationQuery = { __typename?: 'Query', itemsByLocation: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, category: Array<string>, clssfctns?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> };

export type TotalItemsCountByLocationQueryVariables = Exact<{
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm: Scalars['Float']['input'];
  classifications?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  keyword?: InputMaybe<Scalars['String']['input']>;
}>;


export type TotalItemsCountByLocationQuery = { __typename?: 'Query', totalItemsCountByLocation: number };

export type DefaultCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type DefaultCategoriesQuery = { __typename?: 'Query', defaultCategories: Array<string> };

export type RecentAddedItemsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type RecentAddedItemsQuery = { __typename?: 'Query', recentAddedItems: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any }> };

export type GetHostConfigQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHostConfigQuery = { __typename?: 'Query', hostConfig: { __typename?: 'HostConfig', chatLink: string, aboutUsText: string, splashScreenImageUrl?: string | null, splashScreenText?: string | null, itemShareMessageTemplates: Array<string> } };

export type UpdateHostConfigMutationVariables = Exact<{
  input: HostConfigInput;
}>;


export type UpdateHostConfigMutation = { __typename?: 'Mutation', updateHostConfig: { __typename?: 'HostConfig', chatLink: string, aboutUsText: string, splashScreenImageUrl?: string | null, splashScreenText?: string | null, itemShareMessageTemplates: Array<string> } };

export type GetOnLoanItemsByOwnerQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
}>;


export type GetOnLoanItemsByOwnerQuery = { __typename?: 'Query', itemsOnLoanByOwner: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, images?: Array<string> | null, updatedAt: any, createdAt: any, ownerId: string, holderId?: string | null, status: ItemStatus, deposit?: number | null }> };

export type GetUserTransactionsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserTransactionsQuery = { __typename?: 'Query', transactionsByUser: Array<{ __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any, item: { __typename?: 'Item', id: string, name: string, images?: Array<string> | null, thumbnails?: Array<string> | null, ownerId: string, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }, requestor: { __typename?: 'User', id: string, nickname?: string | null, email: string } }> };

export type GetUserOpenTransactionsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserOpenTransactionsQuery = { __typename?: 'Query', openTransactionsByUser: Array<{ __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any, item: { __typename?: 'Item', id: string, name: string, images?: Array<string> | null, thumbnails?: Array<string> | null, ownerId: string, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }, requestor: { __typename?: 'User', id: string, nickname?: string | null, email: string } }> };

export type GenerateSignedUrlMutationVariables = Exact<{
  fileName: Scalars['String']['input'];
  contentType: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
}>;


export type GenerateSignedUrlMutation = { __typename?: 'Mutation', generateSignedUrl: { __typename?: 'SignedUrlResponse', signedUrl: string, gsUrl: string, expires: number } };


export const MeDocument = gql`
    query Me {
  me {
    address
    createdAt
    email
    id
    isVerified
    isActive
    role
    exchangePoints
    nickname
    visibleContentRating
    location {
      latitude
      longitude
    }
  }
}
    `;

/**
 * __useMeQuery__
 *
 * To run a query within a React component, call `useMeQuery` and pass it any options that fit your needs.
 * When your component renders, `useMeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMeQuery({
 *   variables: {
 *   },
 * });
 */
export function useMeQuery(baseOptions?: Apollo.QueryHookOptions<MeQuery, MeQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MeQuery, MeQueryVariables>(MeDocument, options);
      }
export function useMeLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export function useMeSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MeQuery, MeQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MeQuery, MeQueryVariables>(MeDocument, options);
        }
export type MeQueryHookResult = ReturnType<typeof useMeQuery>;
export type MeLazyQueryHookResult = ReturnType<typeof useMeLazyQuery>;
export type MeSuspenseQueryHookResult = ReturnType<typeof useMeSuspenseQuery>;
export type MeQueryResult = Apollo.QueryResult<MeQuery, MeQueryVariables>;
export const HostConfigDocument = gql`
    query HostConfig {
  hostConfig {
    aboutUsText
    chatLink
    splashScreenImageUrl
    splashScreenText
    itemShareMessageTemplates
  }
}
    `;

/**
 * __useHostConfigQuery__
 *
 * To run a query within a React component, call `useHostConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useHostConfigQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHostConfigQuery({
 *   variables: {
 *   },
 * });
 */
export function useHostConfigQuery(baseOptions?: Apollo.QueryHookOptions<HostConfigQuery, HostConfigQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HostConfigQuery, HostConfigQueryVariables>(HostConfigDocument, options);
      }
export function useHostConfigLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HostConfigQuery, HostConfigQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HostConfigQuery, HostConfigQueryVariables>(HostConfigDocument, options);
        }
export function useHostConfigSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HostConfigQuery, HostConfigQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HostConfigQuery, HostConfigQueryVariables>(HostConfigDocument, options);
        }
export type HostConfigQueryHookResult = ReturnType<typeof useHostConfigQuery>;
export type HostConfigLazyQueryHookResult = ReturnType<typeof useHostConfigLazyQuery>;
export type HostConfigSuspenseQueryHookResult = ReturnType<typeof useHostConfigSuspenseQuery>;
export type HostConfigQueryResult = Apollo.QueryResult<HostConfigQuery, HostConfigQueryVariables>;
export const BinderPathsByUserDocument = gql`
    query BinderPathsByUser($userId: ID!) {
  binderPathsByUser(userId: $userId) {
    id
    path
  }
}
    `;

/**
 * __useBinderPathsByUserQuery__
 *
 * To run a query within a React component, call `useBinderPathsByUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useBinderPathsByUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBinderPathsByUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useBinderPathsByUserQuery(baseOptions: Apollo.QueryHookOptions<BinderPathsByUserQuery, BinderPathsByUserQueryVariables> & ({ variables: BinderPathsByUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>(BinderPathsByUserDocument, options);
      }
export function useBinderPathsByUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>(BinderPathsByUserDocument, options);
        }
export function useBinderPathsByUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>(BinderPathsByUserDocument, options);
        }
export type BinderPathsByUserQueryHookResult = ReturnType<typeof useBinderPathsByUserQuery>;
export type BinderPathsByUserLazyQueryHookResult = ReturnType<typeof useBinderPathsByUserLazyQuery>;
export type BinderPathsByUserSuspenseQueryHookResult = ReturnType<typeof useBinderPathsByUserSuspenseQuery>;
export type BinderPathsByUserQueryResult = Apollo.QueryResult<BinderPathsByUserQuery, BinderPathsByUserQueryVariables>;
export const AddBindToBinderDocument = gql`
    mutation AddBindToBinder($parentId: ID!, $newBinderName: String, $bind: BindInput!, $beforeBindId: ID) {
  addBindToBinder(
    parentId: $parentId
    newBinderName: $newBinderName
    bind: $bind
    beforeBindId: $beforeBindId
  ) {
    id
    name
    binds {
      id
      type
      name
    }
    updatedAt
  }
}
    `;
export type AddBindToBinderMutationFn = Apollo.MutationFunction<AddBindToBinderMutation, AddBindToBinderMutationVariables>;

/**
 * __useAddBindToBinderMutation__
 *
 * To run a mutation, you first call `useAddBindToBinderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddBindToBinderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addBindToBinderMutation, { data, loading, error }] = useAddBindToBinderMutation({
 *   variables: {
 *      parentId: // value for 'parentId'
 *      newBinderName: // value for 'newBinderName'
 *      bind: // value for 'bind'
 *      beforeBindId: // value for 'beforeBindId'
 *   },
 * });
 */
export function useAddBindToBinderMutation(baseOptions?: Apollo.MutationHookOptions<AddBindToBinderMutation, AddBindToBinderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddBindToBinderMutation, AddBindToBinderMutationVariables>(AddBindToBinderDocument, options);
      }
export type AddBindToBinderMutationHookResult = ReturnType<typeof useAddBindToBinderMutation>;
export type AddBindToBinderMutationResult = Apollo.MutationResult<AddBindToBinderMutation>;
export type AddBindToBinderMutationOptions = Apollo.BaseMutationOptions<AddBindToBinderMutation, AddBindToBinderMutationVariables>;
export const BinderDetailDocument = gql`
    query BinderDetail($binderId: ID!) {
  binder(id: $binderId) {
    id
    name
    description
    images
    thumbnails
    binds {
      type
      id
      name
    }
    bindedCount
    updatedAt
    owner {
      id
      nickname
      email
    }
  }
}
    `;

/**
 * __useBinderDetailQuery__
 *
 * To run a query within a React component, call `useBinderDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useBinderDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBinderDetailQuery({
 *   variables: {
 *      binderId: // value for 'binderId'
 *   },
 * });
 */
export function useBinderDetailQuery(baseOptions: Apollo.QueryHookOptions<BinderDetailQuery, BinderDetailQueryVariables> & ({ variables: BinderDetailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BinderDetailQuery, BinderDetailQueryVariables>(BinderDetailDocument, options);
      }
export function useBinderDetailLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BinderDetailQuery, BinderDetailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BinderDetailQuery, BinderDetailQueryVariables>(BinderDetailDocument, options);
        }
export function useBinderDetailSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BinderDetailQuery, BinderDetailQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BinderDetailQuery, BinderDetailQueryVariables>(BinderDetailDocument, options);
        }
export type BinderDetailQueryHookResult = ReturnType<typeof useBinderDetailQuery>;
export type BinderDetailLazyQueryHookResult = ReturnType<typeof useBinderDetailLazyQuery>;
export type BinderDetailSuspenseQueryHookResult = ReturnType<typeof useBinderDetailSuspenseQuery>;
export type BinderDetailQueryResult = Apollo.QueryResult<BinderDetailQuery, BinderDetailQueryVariables>;
export const UpdateBinderDocument = gql`
    mutation UpdateBinder($id: ID!, $name: String, $description: String, $images: [String!], $bindIds: [ID!]) {
  updateBinder(
    id: $id
    name: $name
    description: $description
    images: $images
    bindIds: $bindIds
  ) {
    id
    name
    description
    images
    thumbnails
    binds {
      type
      id
      name
    }
    bindedCount
    updatedAt
    owner {
      id
      nickname
      email
    }
  }
}
    `;
export type UpdateBinderMutationFn = Apollo.MutationFunction<UpdateBinderMutation, UpdateBinderMutationVariables>;

/**
 * __useUpdateBinderMutation__
 *
 * To run a mutation, you first call `useUpdateBinderMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBinderMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBinderMutation, { data, loading, error }] = useUpdateBinderMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      description: // value for 'description'
 *      images: // value for 'images'
 *      bindIds: // value for 'bindIds'
 *   },
 * });
 */
export function useUpdateBinderMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBinderMutation, UpdateBinderMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBinderMutation, UpdateBinderMutationVariables>(UpdateBinderDocument, options);
      }
export type UpdateBinderMutationHookResult = ReturnType<typeof useUpdateBinderMutation>;
export type UpdateBinderMutationResult = Apollo.MutationResult<UpdateBinderMutation>;
export type UpdateBinderMutationOptions = Apollo.BaseMutationOptions<UpdateBinderMutation, UpdateBinderMutationVariables>;
export const RecentItemsWithoutClassificationsDocument = gql`
    query RecentItemsWithoutClassifications($limit: Int) {
  recentItemsWithoutClassifications(limit: $limit) {
    id
    name
    description
    category
    updatedAt
    images
    thumbnails
    condition
    status
    language
    publishedYear
    clssfctns
  }
}
    `;

/**
 * __useRecentItemsWithoutClassificationsQuery__
 *
 * To run a query within a React component, call `useRecentItemsWithoutClassificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentItemsWithoutClassificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentItemsWithoutClassificationsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecentItemsWithoutClassificationsQuery(baseOptions?: Apollo.QueryHookOptions<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>(RecentItemsWithoutClassificationsDocument, options);
      }
export function useRecentItemsWithoutClassificationsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>(RecentItemsWithoutClassificationsDocument, options);
        }
export function useRecentItemsWithoutClassificationsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>(RecentItemsWithoutClassificationsDocument, options);
        }
export type RecentItemsWithoutClassificationsQueryHookResult = ReturnType<typeof useRecentItemsWithoutClassificationsQuery>;
export type RecentItemsWithoutClassificationsLazyQueryHookResult = ReturnType<typeof useRecentItemsWithoutClassificationsLazyQuery>;
export type RecentItemsWithoutClassificationsSuspenseQueryHookResult = ReturnType<typeof useRecentItemsWithoutClassificationsSuspenseQuery>;
export type RecentItemsWithoutClassificationsQueryResult = Apollo.QueryResult<RecentItemsWithoutClassificationsQuery, RecentItemsWithoutClassificationsQueryVariables>;
export const UpdateItemClassificationDocument = gql`
    mutation UpdateItemClassification($id: ID!, $classifications: [String!]) {
  updateItem(id: $id, classifications: $classifications) {
    id
    clssfctns
  }
}
    `;
export type UpdateItemClassificationMutationFn = Apollo.MutationFunction<UpdateItemClassificationMutation, UpdateItemClassificationMutationVariables>;

/**
 * __useUpdateItemClassificationMutation__
 *
 * To run a mutation, you first call `useUpdateItemClassificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateItemClassificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateItemClassificationMutation, { data, loading, error }] = useUpdateItemClassificationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      classifications: // value for 'classifications'
 *   },
 * });
 */
export function useUpdateItemClassificationMutation(baseOptions?: Apollo.MutationHookOptions<UpdateItemClassificationMutation, UpdateItemClassificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateItemClassificationMutation, UpdateItemClassificationMutationVariables>(UpdateItemClassificationDocument, options);
      }
export type UpdateItemClassificationMutationHookResult = ReturnType<typeof useUpdateItemClassificationMutation>;
export type UpdateItemClassificationMutationResult = Apollo.MutationResult<UpdateItemClassificationMutation>;
export type UpdateItemClassificationMutationOptions = Apollo.BaseMutationOptions<UpdateItemClassificationMutation, UpdateItemClassificationMutationVariables>;
export const GetItemConfigDocument = gql`
    query GetItemConfig {
  itemConfig {
    defaultCategoryTrees
    categoryMaps {
      language
      value
    }
  }
}
    `;

/**
 * __useGetItemConfigQuery__
 *
 * To run a query within a React component, call `useGetItemConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetItemConfigQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetItemConfigQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetItemConfigQuery(baseOptions?: Apollo.QueryHookOptions<GetItemConfigQuery, GetItemConfigQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetItemConfigQuery, GetItemConfigQueryVariables>(GetItemConfigDocument, options);
      }
export function useGetItemConfigLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemConfigQuery, GetItemConfigQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetItemConfigQuery, GetItemConfigQueryVariables>(GetItemConfigDocument, options);
        }
export function useGetItemConfigSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetItemConfigQuery, GetItemConfigQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetItemConfigQuery, GetItemConfigQueryVariables>(GetItemConfigDocument, options);
        }
export type GetItemConfigQueryHookResult = ReturnType<typeof useGetItemConfigQuery>;
export type GetItemConfigLazyQueryHookResult = ReturnType<typeof useGetItemConfigLazyQuery>;
export type GetItemConfigSuspenseQueryHookResult = ReturnType<typeof useGetItemConfigSuspenseQuery>;
export type GetItemConfigQueryResult = Apollo.QueryResult<GetItemConfigQuery, GetItemConfigQueryVariables>;
export const UpsertCategoryMapDocument = gql`
    mutation UpsertCategoryMap($en: String!, $categoryMaps: [CategoryMapInput!]!) {
  upsertCategoryMap(en: $en, categoryMaps: $categoryMaps) {
    language
    value
  }
}
    `;
export type UpsertCategoryMapMutationFn = Apollo.MutationFunction<UpsertCategoryMapMutation, UpsertCategoryMapMutationVariables>;

/**
 * __useUpsertCategoryMapMutation__
 *
 * To run a mutation, you first call `useUpsertCategoryMapMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpsertCategoryMapMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [upsertCategoryMapMutation, { data, loading, error }] = useUpsertCategoryMapMutation({
 *   variables: {
 *      en: // value for 'en'
 *      categoryMaps: // value for 'categoryMaps'
 *   },
 * });
 */
export function useUpsertCategoryMapMutation(baseOptions?: Apollo.MutationHookOptions<UpsertCategoryMapMutation, UpsertCategoryMapMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpsertCategoryMapMutation, UpsertCategoryMapMutationVariables>(UpsertCategoryMapDocument, options);
      }
export type UpsertCategoryMapMutationHookResult = ReturnType<typeof useUpsertCategoryMapMutation>;
export type UpsertCategoryMapMutationResult = Apollo.MutationResult<UpsertCategoryMapMutation>;
export type UpsertCategoryMapMutationOptions = Apollo.BaseMutationOptions<UpsertCategoryMapMutation, UpsertCategoryMapMutationVariables>;
export const AddCategoryTreeDocument = gql`
    mutation AddCategoryTree($parentPath: String, $leafCategory: String!) {
  addCategoryTree(parentPath: $parentPath, leafCategory: $leafCategory)
}
    `;
export type AddCategoryTreeMutationFn = Apollo.MutationFunction<AddCategoryTreeMutation, AddCategoryTreeMutationVariables>;

/**
 * __useAddCategoryTreeMutation__
 *
 * To run a mutation, you first call `useAddCategoryTreeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCategoryTreeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCategoryTreeMutation, { data, loading, error }] = useAddCategoryTreeMutation({
 *   variables: {
 *      parentPath: // value for 'parentPath'
 *      leafCategory: // value for 'leafCategory'
 *   },
 * });
 */
export function useAddCategoryTreeMutation(baseOptions?: Apollo.MutationHookOptions<AddCategoryTreeMutation, AddCategoryTreeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddCategoryTreeMutation, AddCategoryTreeMutationVariables>(AddCategoryTreeDocument, options);
      }
export type AddCategoryTreeMutationHookResult = ReturnType<typeof useAddCategoryTreeMutation>;
export type AddCategoryTreeMutationResult = Apollo.MutationResult<AddCategoryTreeMutation>;
export type AddCategoryTreeMutationOptions = Apollo.BaseMutationOptions<AddCategoryTreeMutation, AddCategoryTreeMutationVariables>;
export const PendingContentRatingItemsDocument = gql`
    query PendingContentRatingItems($limit: Int) {
  recentItemsWithoutClassifications(limit: $limit) {
    id
    name
    category
    condition
    status
    images
    thumbnails
    contentRating
    contentRatingChecked
    ownerId
  }
}
    `;

/**
 * __usePendingContentRatingItemsQuery__
 *
 * To run a query within a React component, call `usePendingContentRatingItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePendingContentRatingItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePendingContentRatingItemsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function usePendingContentRatingItemsQuery(baseOptions?: Apollo.QueryHookOptions<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>(PendingContentRatingItemsDocument, options);
      }
export function usePendingContentRatingItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>(PendingContentRatingItemsDocument, options);
        }
// @ts-ignore
export function usePendingContentRatingItemsSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>): Apollo.UseSuspenseQueryResult<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>;
export function usePendingContentRatingItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>): Apollo.UseSuspenseQueryResult<PendingContentRatingItemsQuery | undefined, PendingContentRatingItemsQueryVariables>;
export function usePendingContentRatingItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>(PendingContentRatingItemsDocument, options);
        }
export type PendingContentRatingItemsQueryHookResult = ReturnType<typeof usePendingContentRatingItemsQuery>;
export type PendingContentRatingItemsLazyQueryHookResult = ReturnType<typeof usePendingContentRatingItemsLazyQuery>;
export type PendingContentRatingItemsSuspenseQueryHookResult = ReturnType<typeof usePendingContentRatingItemsSuspenseQuery>;
export type PendingContentRatingItemsQueryResult = Apollo.QueryResult<PendingContentRatingItemsQuery, PendingContentRatingItemsQueryVariables>;
export const ApproveContentRatingDocument = gql`
    mutation ApproveContentRating($id: ID!, $contentRatingChecked: Boolean) {
  updateItem(id: $id, contentRatingChecked: $contentRatingChecked) {
    id
    contentRating
    contentRatingChecked
  }
}
    `;
export type ApproveContentRatingMutationFn = Apollo.MutationFunction<ApproveContentRatingMutation, ApproveContentRatingMutationVariables>;

/**
 * __useApproveContentRatingMutation__
 *
 * To run a mutation, you first call `useApproveContentRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveContentRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveContentRatingMutation, { data, loading, error }] = useApproveContentRatingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      contentRatingChecked: // value for 'contentRatingChecked'
 *   },
 * });
 */
export function useApproveContentRatingMutation(baseOptions?: Apollo.MutationHookOptions<ApproveContentRatingMutation, ApproveContentRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveContentRatingMutation, ApproveContentRatingMutationVariables>(ApproveContentRatingDocument, options);
      }
export type ApproveContentRatingMutationHookResult = ReturnType<typeof useApproveContentRatingMutation>;
export type ApproveContentRatingMutationResult = Apollo.MutationResult<ApproveContentRatingMutation>;
export type ApproveContentRatingMutationOptions = Apollo.BaseMutationOptions<ApproveContentRatingMutation, ApproveContentRatingMutationVariables>;
export const AddItemCommentDocument = gql`
    mutation AddItemComment($itemId: ID!, $content: String!) {
  addItemComment(itemId: $itemId, content: $content)
}
    `;
export type AddItemCommentMutationFn = Apollo.MutationFunction<AddItemCommentMutation, AddItemCommentMutationVariables>;

/**
 * __useAddItemCommentMutation__
 *
 * To run a mutation, you first call `useAddItemCommentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddItemCommentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addItemCommentMutation, { data, loading, error }] = useAddItemCommentMutation({
 *   variables: {
 *      itemId: // value for 'itemId'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useAddItemCommentMutation(baseOptions?: Apollo.MutationHookOptions<AddItemCommentMutation, AddItemCommentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddItemCommentMutation, AddItemCommentMutationVariables>(AddItemCommentDocument, options);
      }
export type AddItemCommentMutationHookResult = ReturnType<typeof useAddItemCommentMutation>;
export type AddItemCommentMutationResult = Apollo.MutationResult<AddItemCommentMutation>;
export type AddItemCommentMutationOptions = Apollo.BaseMutationOptions<AddItemCommentMutation, AddItemCommentMutationVariables>;
export const GetItemCommentsDocument = gql`
    query GetItemComments($itemId: ID!, $first: Int!) {
  commentsByItemId(itemId: $itemId, first: $first) {
    comments {
      id
      content
      createdAt
      userId
      userNickname
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    `;

/**
 * __useGetItemCommentsQuery__
 *
 * To run a query within a React component, call `useGetItemCommentsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetItemCommentsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetItemCommentsQuery({
 *   variables: {
 *      itemId: // value for 'itemId'
 *      first: // value for 'first'
 *   },
 * });
 */
export function useGetItemCommentsQuery(baseOptions: Apollo.QueryHookOptions<GetItemCommentsQuery, GetItemCommentsQueryVariables> & ({ variables: GetItemCommentsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetItemCommentsQuery, GetItemCommentsQueryVariables>(GetItemCommentsDocument, options);
      }
export function useGetItemCommentsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemCommentsQuery, GetItemCommentsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetItemCommentsQuery, GetItemCommentsQueryVariables>(GetItemCommentsDocument, options);
        }
export function useGetItemCommentsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetItemCommentsQuery, GetItemCommentsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetItemCommentsQuery, GetItemCommentsQueryVariables>(GetItemCommentsDocument, options);
        }
export type GetItemCommentsQueryHookResult = ReturnType<typeof useGetItemCommentsQuery>;
export type GetItemCommentsLazyQueryHookResult = ReturnType<typeof useGetItemCommentsLazyQuery>;
export type GetItemCommentsSuspenseQueryHookResult = ReturnType<typeof useGetItemCommentsSuspenseQuery>;
export type GetItemCommentsQueryResult = Apollo.QueryResult<GetItemCommentsQuery, GetItemCommentsQueryVariables>;
export const ItemDocument = gql`
    query Item($itemId: ID!) {
  item(id: $itemId) {
    id
    name
    description
    condition
    category
    clssfctns
    status
    images
    thumbnails
    publishedYear
    language
    createdAt
    ownerId
    holderId
    deposit
    isbn
    contentRating
    contentRatingChecked
  }
}
    `;

/**
 * __useItemQuery__
 *
 * To run a query within a React component, call `useItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useItemQuery({
 *   variables: {
 *      itemId: // value for 'itemId'
 *   },
 * });
 */
export function useItemQuery(baseOptions: Apollo.QueryHookOptions<ItemQuery, ItemQueryVariables> & ({ variables: ItemQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ItemQuery, ItemQueryVariables>(ItemDocument, options);
      }
export function useItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ItemQuery, ItemQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ItemQuery, ItemQueryVariables>(ItemDocument, options);
        }
export function useItemSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ItemQuery, ItemQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ItemQuery, ItemQueryVariables>(ItemDocument, options);
        }
export type ItemQueryHookResult = ReturnType<typeof useItemQuery>;
export type ItemLazyQueryHookResult = ReturnType<typeof useItemLazyQuery>;
export type ItemSuspenseQueryHookResult = ReturnType<typeof useItemSuspenseQuery>;
export type ItemQueryResult = Apollo.QueryResult<ItemQuery, ItemQueryVariables>;
export const UpdateItemCheckedDocument = gql`
    mutation UpdateItemChecked($id: ID!, $contentRatingChecked: Boolean) {
  updateItem(id: $id, contentRatingChecked: $contentRatingChecked) {
    id
    contentRating
    contentRatingChecked
  }
}
    `;
export type UpdateItemCheckedMutationFn = Apollo.MutationFunction<UpdateItemCheckedMutation, UpdateItemCheckedMutationVariables>;

/**
 * __useUpdateItemCheckedMutation__
 *
 * To run a mutation, you first call `useUpdateItemCheckedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateItemCheckedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateItemCheckedMutation, { data, loading, error }] = useUpdateItemCheckedMutation({
 *   variables: {
 *      id: // value for 'id'
 *      contentRatingChecked: // value for 'contentRatingChecked'
 *   },
 * });
 */
export function useUpdateItemCheckedMutation(baseOptions?: Apollo.MutationHookOptions<UpdateItemCheckedMutation, UpdateItemCheckedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateItemCheckedMutation, UpdateItemCheckedMutationVariables>(UpdateItemCheckedDocument, options);
      }
export type UpdateItemCheckedMutationHookResult = ReturnType<typeof useUpdateItemCheckedMutation>;
export type UpdateItemCheckedMutationResult = Apollo.MutationResult<UpdateItemCheckedMutation>;
export type UpdateItemCheckedMutationOptions = Apollo.BaseMutationOptions<UpdateItemCheckedMutation, UpdateItemCheckedMutationVariables>;
export const CreateTransactionDocument = gql`
    mutation CreateTransaction($itemId: ID!, $location: TransactionLocation!, $locationIndex: Int, $details: String!) {
  createTransaction(
    itemId: $itemId
    location: $location
    locationIndex: $locationIndex
    details: $details
  ) {
    id
    status
    createdAt
    updatedAt
  }
}
    `;
export type CreateTransactionMutationFn = Apollo.MutationFunction<CreateTransactionMutation, CreateTransactionMutationVariables>;

/**
 * __useCreateTransactionMutation__
 *
 * To run a mutation, you first call `useCreateTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTransactionMutation, { data, loading, error }] = useCreateTransactionMutation({
 *   variables: {
 *      itemId: // value for 'itemId'
 *      location: // value for 'location'
 *      locationIndex: // value for 'locationIndex'
 *      details: // value for 'details'
 *   },
 * });
 */
export function useCreateTransactionMutation(baseOptions?: Apollo.MutationHookOptions<CreateTransactionMutation, CreateTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateTransactionMutation, CreateTransactionMutationVariables>(CreateTransactionDocument, options);
      }
export type CreateTransactionMutationHookResult = ReturnType<typeof useCreateTransactionMutation>;
export type CreateTransactionMutationResult = Apollo.MutationResult<CreateTransactionMutation>;
export type CreateTransactionMutationOptions = Apollo.BaseMutationOptions<CreateTransactionMutation, CreateTransactionMutationVariables>;
export const CreateQuickTransactionDocument = gql`
    mutation CreateQuickTransaction($itemId: ID!, $details: String!) {
  createQuickTransaction(itemId: $itemId, details: $details) {
    id
    status
    createdAt
    updatedAt
  }
}
    `;
export type CreateQuickTransactionMutationFn = Apollo.MutationFunction<CreateQuickTransactionMutation, CreateQuickTransactionMutationVariables>;

/**
 * __useCreateQuickTransactionMutation__
 *
 * To run a mutation, you first call `useCreateQuickTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateQuickTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createQuickTransactionMutation, { data, loading, error }] = useCreateQuickTransactionMutation({
 *   variables: {
 *      itemId: // value for 'itemId'
 *      details: // value for 'details'
 *   },
 * });
 */
export function useCreateQuickTransactionMutation(baseOptions?: Apollo.MutationHookOptions<CreateQuickTransactionMutation, CreateQuickTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateQuickTransactionMutation, CreateQuickTransactionMutationVariables>(CreateQuickTransactionDocument, options);
      }
export type CreateQuickTransactionMutationHookResult = ReturnType<typeof useCreateQuickTransactionMutation>;
export type CreateQuickTransactionMutationResult = Apollo.MutationResult<CreateQuickTransactionMutation>;
export type CreateQuickTransactionMutationOptions = Apollo.BaseMutationOptions<CreateQuickTransactionMutation, CreateQuickTransactionMutationVariables>;
export const GetUserForItemDocument = gql`
    query GetUserForItem($userId: ID!) {
  user(id: $userId) {
    createdAt
    email
    id
    nickname
    contactMethods {
      type
      value
      isPublic
    }
    address
    exchangePoints
    location {
      latitude
      longitude
    }
    pinItems {
      id
    }
  }
}
    `;

/**
 * __useGetUserForItemQuery__
 *
 * To run a query within a React component, call `useGetUserForItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserForItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserForItemQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserForItemQuery(baseOptions: Apollo.QueryHookOptions<GetUserForItemQuery, GetUserForItemQueryVariables> & ({ variables: GetUserForItemQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserForItemQuery, GetUserForItemQueryVariables>(GetUserForItemDocument, options);
      }
export function useGetUserForItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserForItemQuery, GetUserForItemQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserForItemQuery, GetUserForItemQueryVariables>(GetUserForItemDocument, options);
        }
export function useGetUserForItemSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserForItemQuery, GetUserForItemQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserForItemQuery, GetUserForItemQueryVariables>(GetUserForItemDocument, options);
        }
export type GetUserForItemQueryHookResult = ReturnType<typeof useGetUserForItemQuery>;
export type GetUserForItemLazyQueryHookResult = ReturnType<typeof useGetUserForItemLazyQuery>;
export type GetUserForItemSuspenseQueryHookResult = ReturnType<typeof useGetUserForItemSuspenseQuery>;
export type GetUserForItemQueryResult = Apollo.QueryResult<GetUserForItemQuery, GetUserForItemQueryVariables>;
export const OpenTransactionsByItemDocument = gql`
    query OpenTransactionsByItem($itemId: ID!) {
  openTransactionsByItem(itemId: $itemId) {
    id
    requestor {
      id
      nickname
      email
    }
    details
    status
    createdAt
    updatedAt
  }
}
    `;

/**
 * __useOpenTransactionsByItemQuery__
 *
 * To run a query within a React component, call `useOpenTransactionsByItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useOpenTransactionsByItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOpenTransactionsByItemQuery({
 *   variables: {
 *      itemId: // value for 'itemId'
 *   },
 * });
 */
export function useOpenTransactionsByItemQuery(baseOptions: Apollo.QueryHookOptions<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables> & ({ variables: OpenTransactionsByItemQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>(OpenTransactionsByItemDocument, options);
      }
export function useOpenTransactionsByItemLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>(OpenTransactionsByItemDocument, options);
        }
export function useOpenTransactionsByItemSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>(OpenTransactionsByItemDocument, options);
        }
export type OpenTransactionsByItemQueryHookResult = ReturnType<typeof useOpenTransactionsByItemQuery>;
export type OpenTransactionsByItemLazyQueryHookResult = ReturnType<typeof useOpenTransactionsByItemLazyQuery>;
export type OpenTransactionsByItemSuspenseQueryHookResult = ReturnType<typeof useOpenTransactionsByItemSuspenseQuery>;
export type OpenTransactionsByItemQueryResult = Apollo.QueryResult<OpenTransactionsByItemQuery, OpenTransactionsByItemQueryVariables>;
export const PinItemDocument = gql`
    mutation PinItem($itemId: ID!) {
  pinItem(itemId: $itemId)
}
    `;
export type PinItemMutationFn = Apollo.MutationFunction<PinItemMutation, PinItemMutationVariables>;

/**
 * __usePinItemMutation__
 *
 * To run a mutation, you first call `usePinItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePinItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [pinItemMutation, { data, loading, error }] = usePinItemMutation({
 *   variables: {
 *      itemId: // value for 'itemId'
 *   },
 * });
 */
export function usePinItemMutation(baseOptions?: Apollo.MutationHookOptions<PinItemMutation, PinItemMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PinItemMutation, PinItemMutationVariables>(PinItemDocument, options);
      }
export type PinItemMutationHookResult = ReturnType<typeof usePinItemMutation>;
export type PinItemMutationResult = Apollo.MutationResult<PinItemMutation>;
export type PinItemMutationOptions = Apollo.BaseMutationOptions<PinItemMutation, PinItemMutationVariables>;
export const UnpinItemDocument = gql`
    mutation UnpinItem($itemId: ID!) {
  unpinItem(itemId: $itemId)
}
    `;
export type UnpinItemMutationFn = Apollo.MutationFunction<UnpinItemMutation, UnpinItemMutationVariables>;

/**
 * __useUnpinItemMutation__
 *
 * To run a mutation, you first call `useUnpinItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUnpinItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [unpinItemMutation, { data, loading, error }] = useUnpinItemMutation({
 *   variables: {
 *      itemId: // value for 'itemId'
 *   },
 * });
 */
export function useUnpinItemMutation(baseOptions?: Apollo.MutationHookOptions<UnpinItemMutation, UnpinItemMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UnpinItemMutation, UnpinItemMutationVariables>(UnpinItemDocument, options);
      }
export type UnpinItemMutationHookResult = ReturnType<typeof useUnpinItemMutation>;
export type UnpinItemMutationResult = Apollo.MutationResult<UnpinItemMutation>;
export type UnpinItemMutationOptions = Apollo.BaseMutationOptions<UnpinItemMutation, UnpinItemMutationVariables>;
export const BindersFromItemIdDocument = gql`
    query BindersFromItemId($itemId: ID!) {
  bindersFromItemId(itemId: $itemId) {
    id
    name
    description
    images
    thumbnails
    binds {
      type
      id
      name
    }
    bindedCount
    updatedAt
    owner {
      id
      nickname
      email
    }
  }
}
    `;

/**
 * __useBindersFromItemIdQuery__
 *
 * To run a query within a React component, call `useBindersFromItemIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useBindersFromItemIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBindersFromItemIdQuery({
 *   variables: {
 *      itemId: // value for 'itemId'
 *   },
 * });
 */
export function useBindersFromItemIdQuery(baseOptions: Apollo.QueryHookOptions<BindersFromItemIdQuery, BindersFromItemIdQueryVariables> & ({ variables: BindersFromItemIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>(BindersFromItemIdDocument, options);
      }
export function useBindersFromItemIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>(BindersFromItemIdDocument, options);
        }
export function useBindersFromItemIdSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>(BindersFromItemIdDocument, options);
        }
export type BindersFromItemIdQueryHookResult = ReturnType<typeof useBindersFromItemIdQuery>;
export type BindersFromItemIdLazyQueryHookResult = ReturnType<typeof useBindersFromItemIdLazyQuery>;
export type BindersFromItemIdSuspenseQueryHookResult = ReturnType<typeof useBindersFromItemIdSuspenseQuery>;
export type BindersFromItemIdQueryResult = Apollo.QueryResult<BindersFromItemIdQuery, BindersFromItemIdQueryVariables>;
export const CreateItemDocument = gql`
    mutation CreateItem($name: String!, $category: [String!]!, $condition: ItemCondition!, $description: String, $images: [String!], $language: Language!, $publishedYear: Int, $status: ItemStatus!, $deposit: Int, $contentRating: Int) {
  createItem(
    name: $name
    category: $category
    condition: $condition
    description: $description
    images: $images
    language: $language
    publishedYear: $publishedYear
    status: $status
    deposit: $deposit
    contentRating: $contentRating
  ) {
    id
    name
    description
    condition
    category
    status
    images
    publishedYear
    language
    createdAt
    ownerId
    updatedAt
    deposit
    contentRating
    contentRatingChecked
  }
}
    `;
export type CreateItemMutationFn = Apollo.MutationFunction<CreateItemMutation, CreateItemMutationVariables>;

/**
 * __useCreateItemMutation__
 *
 * To run a mutation, you first call `useCreateItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createItemMutation, { data, loading, error }] = useCreateItemMutation({
 *   variables: {
 *      name: // value for 'name'
 *      category: // value for 'category'
 *      condition: // value for 'condition'
 *      description: // value for 'description'
 *      images: // value for 'images'
 *      language: // value for 'language'
 *      publishedYear: // value for 'publishedYear'
 *      status: // value for 'status'
 *      deposit: // value for 'deposit'
 *      contentRating: // value for 'contentRating'
 *   },
 * });
 */
export function useCreateItemMutation(baseOptions?: Apollo.MutationHookOptions<CreateItemMutation, CreateItemMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateItemMutation, CreateItemMutationVariables>(CreateItemDocument, options);
      }
export type CreateItemMutationHookResult = ReturnType<typeof useCreateItemMutation>;
export type CreateItemMutationResult = Apollo.MutationResult<CreateItemMutation>;
export type CreateItemMutationOptions = Apollo.BaseMutationOptions<CreateItemMutation, CreateItemMutationVariables>;
export const UpdateItemDocument = gql`
    mutation UpdateItem($id: ID!, $name: String, $category: [String!], $classifications: [String!], $condition: ItemCondition, $description: String, $images: [String!], $language: Language, $publishedYear: Int, $status: ItemStatus, $deposit: Int, $contentRating: Int, $contentRatingChecked: Boolean) {
  updateItem(
    id: $id
    name: $name
    category: $category
    classifications: $classifications
    condition: $condition
    description: $description
    images: $images
    language: $language
    publishedYear: $publishedYear
    status: $status
    deposit: $deposit
    contentRating: $contentRating
    contentRatingChecked: $contentRatingChecked
  ) {
    id
    name
    description
    condition
    category
    status
    images
    publishedYear
    language
    createdAt
    ownerId
    updatedAt
    deposit
    contentRating
    contentRatingChecked
  }
}
    `;
export type UpdateItemMutationFn = Apollo.MutationFunction<UpdateItemMutation, UpdateItemMutationVariables>;

/**
 * __useUpdateItemMutation__
 *
 * To run a mutation, you first call `useUpdateItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateItemMutation, { data, loading, error }] = useUpdateItemMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      category: // value for 'category'
 *      classifications: // value for 'classifications'
 *      condition: // value for 'condition'
 *      description: // value for 'description'
 *      images: // value for 'images'
 *      language: // value for 'language'
 *      publishedYear: // value for 'publishedYear'
 *      status: // value for 'status'
 *      deposit: // value for 'deposit'
 *      contentRating: // value for 'contentRating'
 *      contentRatingChecked: // value for 'contentRatingChecked'
 *   },
 * });
 */
export function useUpdateItemMutation(baseOptions?: Apollo.MutationHookOptions<UpdateItemMutation, UpdateItemMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateItemMutation, UpdateItemMutationVariables>(UpdateItemDocument, options);
      }
export type UpdateItemMutationHookResult = ReturnType<typeof useUpdateItemMutation>;
export type UpdateItemMutationResult = Apollo.MutationResult<UpdateItemMutation>;
export type UpdateItemMutationOptions = Apollo.BaseMutationOptions<UpdateItemMutation, UpdateItemMutationVariables>;
export const GetUserOpenTransactionsForCountDocument = gql`
    query GetUserOpenTransactionsForCount($userId: ID!) {
  openTransactionsByUser(userId: $userId) {
    id
    status
    createdAt
    item {
      id
      name
    }
  }
}
    `;

/**
 * __useGetUserOpenTransactionsForCountQuery__
 *
 * To run a query within a React component, call `useGetUserOpenTransactionsForCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserOpenTransactionsForCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserOpenTransactionsForCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserOpenTransactionsForCountQuery(baseOptions: Apollo.QueryHookOptions<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables> & ({ variables: GetUserOpenTransactionsForCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>(GetUserOpenTransactionsForCountDocument, options);
      }
export function useGetUserOpenTransactionsForCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>(GetUserOpenTransactionsForCountDocument, options);
        }
export function useGetUserOpenTransactionsForCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>(GetUserOpenTransactionsForCountDocument, options);
        }
export type GetUserOpenTransactionsForCountQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsForCountQuery>;
export type GetUserOpenTransactionsForCountLazyQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsForCountLazyQuery>;
export type GetUserOpenTransactionsForCountSuspenseQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsForCountSuspenseQuery>;
export type GetUserOpenTransactionsForCountQueryResult = Apollo.QueryResult<GetUserOpenTransactionsForCountQuery, GetUserOpenTransactionsForCountQueryVariables>;
export const NewsPostDocument = gql`
    query NewsPost($newsPostId: ID!) {
  newsPost(id: $newsPostId) {
    id
    title
    content
    images
    relatedItems {
      id
      name
      category
      status
    }
    createdAt
    updatedAt
    tags
    user {
      id
      nickname
    }
  }
}
    `;

/**
 * __useNewsPostQuery__
 *
 * To run a query within a React component, call `useNewsPostQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewsPostQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewsPostQuery({
 *   variables: {
 *      newsPostId: // value for 'newsPostId'
 *   },
 * });
 */
export function useNewsPostQuery(baseOptions: Apollo.QueryHookOptions<NewsPostQuery, NewsPostQueryVariables> & ({ variables: NewsPostQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewsPostQuery, NewsPostQueryVariables>(NewsPostDocument, options);
      }
export function useNewsPostLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewsPostQuery, NewsPostQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewsPostQuery, NewsPostQueryVariables>(NewsPostDocument, options);
        }
export function useNewsPostSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NewsPostQuery, NewsPostQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NewsPostQuery, NewsPostQueryVariables>(NewsPostDocument, options);
        }
export type NewsPostQueryHookResult = ReturnType<typeof useNewsPostQuery>;
export type NewsPostLazyQueryHookResult = ReturnType<typeof useNewsPostLazyQuery>;
export type NewsPostSuspenseQueryHookResult = ReturnType<typeof useNewsPostSuspenseQuery>;
export type NewsPostQueryResult = Apollo.QueryResult<NewsPostQuery, NewsPostQueryVariables>;
export const CreateNewsPostDocument = gql`
    mutation CreateNewsPost($title: String!, $content: String!, $images: [String!], $relatedItemIds: [ID!], $tags: [String!]) {
  createNewsPost(
    title: $title
    content: $content
    images: $images
    relatedItemIds: $relatedItemIds
    tags: $tags
  ) {
    id
    title
    content
    images
    createdAt
    updatedAt
    relatedItems {
      id
      name
      thumbnails
      images
    }
  }
}
    `;
export type CreateNewsPostMutationFn = Apollo.MutationFunction<CreateNewsPostMutation, CreateNewsPostMutationVariables>;

/**
 * __useCreateNewsPostMutation__
 *
 * To run a mutation, you first call `useCreateNewsPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNewsPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNewsPostMutation, { data, loading, error }] = useCreateNewsPostMutation({
 *   variables: {
 *      title: // value for 'title'
 *      content: // value for 'content'
 *      images: // value for 'images'
 *      relatedItemIds: // value for 'relatedItemIds'
 *      tags: // value for 'tags'
 *   },
 * });
 */
export function useCreateNewsPostMutation(baseOptions?: Apollo.MutationHookOptions<CreateNewsPostMutation, CreateNewsPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateNewsPostMutation, CreateNewsPostMutationVariables>(CreateNewsPostDocument, options);
      }
export type CreateNewsPostMutationHookResult = ReturnType<typeof useCreateNewsPostMutation>;
export type CreateNewsPostMutationResult = Apollo.MutationResult<CreateNewsPostMutation>;
export type CreateNewsPostMutationOptions = Apollo.BaseMutationOptions<CreateNewsPostMutation, CreateNewsPostMutationVariables>;
export const UpdateNewsPostDocument = gql`
    mutation UpdateNewsPost($id: ID!, $title: String, $content: String, $images: [String!], $relatedItemIds: [ID!], $tags: [String!]) {
  updateNewsPost(
    id: $id
    title: $title
    content: $content
    images: $images
    relatedItemIds: $relatedItemIds
    tags: $tags
  ) {
    id
    title
    content
    images
    isVisible
    updatedAt
    relatedItems {
      id
      name
      thumbnails
      images
    }
  }
}
    `;
export type UpdateNewsPostMutationFn = Apollo.MutationFunction<UpdateNewsPostMutation, UpdateNewsPostMutationVariables>;

/**
 * __useUpdateNewsPostMutation__
 *
 * To run a mutation, you first call `useUpdateNewsPostMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNewsPostMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNewsPostMutation, { data, loading, error }] = useUpdateNewsPostMutation({
 *   variables: {
 *      id: // value for 'id'
 *      title: // value for 'title'
 *      content: // value for 'content'
 *      images: // value for 'images'
 *      relatedItemIds: // value for 'relatedItemIds'
 *      tags: // value for 'tags'
 *   },
 * });
 */
export function useUpdateNewsPostMutation(baseOptions?: Apollo.MutationHookOptions<UpdateNewsPostMutation, UpdateNewsPostMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateNewsPostMutation, UpdateNewsPostMutationVariables>(UpdateNewsPostDocument, options);
      }
export type UpdateNewsPostMutationHookResult = ReturnType<typeof useUpdateNewsPostMutation>;
export type UpdateNewsPostMutationResult = Apollo.MutationResult<UpdateNewsPostMutation>;
export type UpdateNewsPostMutationOptions = Apollo.BaseMutationOptions<UpdateNewsPostMutation, UpdateNewsPostMutationVariables>;
export const RecentItemsDocument = gql`
    query RecentItems($category: [String!], $limit: Int) {
  recentAddedItems(category: $category, limit: $limit) {
    id
    name
    description
    condition
    category
    status
    images
    publishedYear
    language
    createdAt
  }
}
    `;

/**
 * __useRecentItemsQuery__
 *
 * To run a query within a React component, call `useRecentItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentItemsQuery({
 *   variables: {
 *      category: // value for 'category'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecentItemsQuery(baseOptions?: Apollo.QueryHookOptions<RecentItemsQuery, RecentItemsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecentItemsQuery, RecentItemsQueryVariables>(RecentItemsDocument, options);
      }
export function useRecentItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecentItemsQuery, RecentItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecentItemsQuery, RecentItemsQueryVariables>(RecentItemsDocument, options);
        }
export function useRecentItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentItemsQuery, RecentItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecentItemsQuery, RecentItemsQueryVariables>(RecentItemsDocument, options);
        }
export type RecentItemsQueryHookResult = ReturnType<typeof useRecentItemsQuery>;
export type RecentItemsLazyQueryHookResult = ReturnType<typeof useRecentItemsLazyQuery>;
export type RecentItemsSuspenseQueryHookResult = ReturnType<typeof useRecentItemsSuspenseQuery>;
export type RecentItemsQueryResult = Apollo.QueryResult<RecentItemsQuery, RecentItemsQueryVariables>;
export const RecommendedItemsForBannerDocument = gql`
    query RecommendedItemsForBanner($type: RecommendationType!, $limit: Int!) {
  recommendedItems(type: $type, limit: $limit) {
    id
    name
    description
    condition
    category
    status
    images
    publishedYear
    language
    createdAt
  }
}
    `;

/**
 * __useRecommendedItemsForBannerQuery__
 *
 * To run a query within a React component, call `useRecommendedItemsForBannerQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecommendedItemsForBannerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecommendedItemsForBannerQuery({
 *   variables: {
 *      type: // value for 'type'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecommendedItemsForBannerQuery(baseOptions: Apollo.QueryHookOptions<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables> & ({ variables: RecommendedItemsForBannerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>(RecommendedItemsForBannerDocument, options);
      }
export function useRecommendedItemsForBannerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>(RecommendedItemsForBannerDocument, options);
        }
export function useRecommendedItemsForBannerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>(RecommendedItemsForBannerDocument, options);
        }
export type RecommendedItemsForBannerQueryHookResult = ReturnType<typeof useRecommendedItemsForBannerQuery>;
export type RecommendedItemsForBannerLazyQueryHookResult = ReturnType<typeof useRecommendedItemsForBannerLazyQuery>;
export type RecommendedItemsForBannerSuspenseQueryHookResult = ReturnType<typeof useRecommendedItemsForBannerSuspenseQuery>;
export type RecommendedItemsForBannerQueryResult = Apollo.QueryResult<RecommendedItemsForBannerQuery, RecommendedItemsForBannerQueryVariables>;
export const NewsRecentPostsDocument = gql`
    query NewsRecentPosts($limit: Int, $offset: Int) {
  newsRecentPosts(limit: $limit, offset: $offset) {
    id
    title
    images
    createdAt
    tags
  }
}
    `;

/**
 * __useNewsRecentPostsQuery__
 *
 * To run a query within a React component, call `useNewsRecentPostsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNewsRecentPostsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNewsRecentPostsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useNewsRecentPostsQuery(baseOptions?: Apollo.QueryHookOptions<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>(NewsRecentPostsDocument, options);
      }
export function useNewsRecentPostsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>(NewsRecentPostsDocument, options);
        }
export function useNewsRecentPostsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>(NewsRecentPostsDocument, options);
        }
export type NewsRecentPostsQueryHookResult = ReturnType<typeof useNewsRecentPostsQuery>;
export type NewsRecentPostsLazyQueryHookResult = ReturnType<typeof useNewsRecentPostsLazyQuery>;
export type NewsRecentPostsSuspenseQueryHookResult = ReturnType<typeof useNewsRecentPostsSuspenseQuery>;
export type NewsRecentPostsQueryResult = Apollo.QueryResult<NewsRecentPostsQuery, NewsRecentPostsQueryVariables>;
export const GetTransactionDocument = gql`
    query GetTransaction($id: ID!) {
  transaction(id: $id) {
    id
    status
    createdAt
    updatedAt
    item {
      id
      name
      description
      images
      thumbnails
      condition
      category
      ownerId
      holderId
      location {
        latitude
        longitude
      }
    }
    details
    requestor {
      id
      nickname
      email
      contactMethods {
        type
        value
        isPublic
      }
      location {
        latitude
        longitude
      }
      role
      address
    }
    receiver {
      id
      nickname
      email
      contactMethods {
        type
        value
        isPublic
      }
      location {
        latitude
        longitude
      }
      role
      address
    }
    location {
      latitude
      longitude
    }
    images
  }
}
    `;

/**
 * __useGetTransactionQuery__
 *
 * To run a query within a React component, call `useGetTransactionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTransactionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTransactionQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetTransactionQuery(baseOptions: Apollo.QueryHookOptions<GetTransactionQuery, GetTransactionQueryVariables> & ({ variables: GetTransactionQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTransactionQuery, GetTransactionQueryVariables>(GetTransactionDocument, options);
      }
export function useGetTransactionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTransactionQuery, GetTransactionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTransactionQuery, GetTransactionQueryVariables>(GetTransactionDocument, options);
        }
export function useGetTransactionSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTransactionQuery, GetTransactionQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetTransactionQuery, GetTransactionQueryVariables>(GetTransactionDocument, options);
        }
export type GetTransactionQueryHookResult = ReturnType<typeof useGetTransactionQuery>;
export type GetTransactionLazyQueryHookResult = ReturnType<typeof useGetTransactionLazyQuery>;
export type GetTransactionSuspenseQueryHookResult = ReturnType<typeof useGetTransactionSuspenseQuery>;
export type GetTransactionQueryResult = Apollo.QueryResult<GetTransactionQuery, GetTransactionQueryVariables>;
export const ApproveTransactionDocument = gql`
    mutation ApproveTransaction($id: ID!) {
  approveTransaction(id: $id) {
    id
    status
    updatedAt
  }
}
    `;
export type ApproveTransactionMutationFn = Apollo.MutationFunction<ApproveTransactionMutation, ApproveTransactionMutationVariables>;

/**
 * __useApproveTransactionMutation__
 *
 * To run a mutation, you first call `useApproveTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useApproveTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [approveTransactionMutation, { data, loading, error }] = useApproveTransactionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useApproveTransactionMutation(baseOptions?: Apollo.MutationHookOptions<ApproveTransactionMutation, ApproveTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ApproveTransactionMutation, ApproveTransactionMutationVariables>(ApproveTransactionDocument, options);
      }
export type ApproveTransactionMutationHookResult = ReturnType<typeof useApproveTransactionMutation>;
export type ApproveTransactionMutationResult = Apollo.MutationResult<ApproveTransactionMutation>;
export type ApproveTransactionMutationOptions = Apollo.BaseMutationOptions<ApproveTransactionMutation, ApproveTransactionMutationVariables>;
export const TransferTransactionDocument = gql`
    mutation TransferTransaction($id: ID!) {
  transferTransaction(id: $id) {
    id
    status
    updatedAt
  }
}
    `;
export type TransferTransactionMutationFn = Apollo.MutationFunction<TransferTransactionMutation, TransferTransactionMutationVariables>;

/**
 * __useTransferTransactionMutation__
 *
 * To run a mutation, you first call `useTransferTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useTransferTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [transferTransactionMutation, { data, loading, error }] = useTransferTransactionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTransferTransactionMutation(baseOptions?: Apollo.MutationHookOptions<TransferTransactionMutation, TransferTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<TransferTransactionMutation, TransferTransactionMutationVariables>(TransferTransactionDocument, options);
      }
export type TransferTransactionMutationHookResult = ReturnType<typeof useTransferTransactionMutation>;
export type TransferTransactionMutationResult = Apollo.MutationResult<TransferTransactionMutation>;
export type TransferTransactionMutationOptions = Apollo.BaseMutationOptions<TransferTransactionMutation, TransferTransactionMutationVariables>;
export const ReceiveTransactionDocument = gql`
    mutation ReceiveTransaction($id: ID!, $images: [String!]) {
  receiveTransaction(id: $id, images: $images) {
    id
    status
    updatedAt
    images
  }
}
    `;
export type ReceiveTransactionMutationFn = Apollo.MutationFunction<ReceiveTransactionMutation, ReceiveTransactionMutationVariables>;

/**
 * __useReceiveTransactionMutation__
 *
 * To run a mutation, you first call `useReceiveTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useReceiveTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [receiveTransactionMutation, { data, loading, error }] = useReceiveTransactionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      images: // value for 'images'
 *   },
 * });
 */
export function useReceiveTransactionMutation(baseOptions?: Apollo.MutationHookOptions<ReceiveTransactionMutation, ReceiveTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ReceiveTransactionMutation, ReceiveTransactionMutationVariables>(ReceiveTransactionDocument, options);
      }
export type ReceiveTransactionMutationHookResult = ReturnType<typeof useReceiveTransactionMutation>;
export type ReceiveTransactionMutationResult = Apollo.MutationResult<ReceiveTransactionMutation>;
export type ReceiveTransactionMutationOptions = Apollo.BaseMutationOptions<ReceiveTransactionMutation, ReceiveTransactionMutationVariables>;
export const CancelTransactionDocument = gql`
    mutation CancelTransaction($id: ID!) {
  cancelTransaction(id: $id)
}
    `;
export type CancelTransactionMutationFn = Apollo.MutationFunction<CancelTransactionMutation, CancelTransactionMutationVariables>;

/**
 * __useCancelTransactionMutation__
 *
 * To run a mutation, you first call `useCancelTransactionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelTransactionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelTransactionMutation, { data, loading, error }] = useCancelTransactionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCancelTransactionMutation(baseOptions?: Apollo.MutationHookOptions<CancelTransactionMutation, CancelTransactionMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CancelTransactionMutation, CancelTransactionMutationVariables>(CancelTransactionDocument, options);
      }
export type CancelTransactionMutationHookResult = ReturnType<typeof useCancelTransactionMutation>;
export type CancelTransactionMutationResult = Apollo.MutationResult<CancelTransactionMutation>;
export type CancelTransactionMutationOptions = Apollo.BaseMutationOptions<CancelTransactionMutation, CancelTransactionMutationVariables>;
export const ItemsByUserDocument = gql`
    query ItemsByUser($userId: ID!, $limit: Int, $offset: Int, $category: [String!], $isExchangePointItem: Boolean) {
  itemsByUser(
    userId: $userId
    limit: $limit
    offset: $offset
    category: $category
    isExchangePointItem: $isExchangePointItem
  ) {
    id
    name
    description
    condition
    status
    images
    thumbnails
    category
    publishedYear
    language
    location {
      latitude
      longitude
    }
    createdAt
  }
}
    `;

/**
 * __useItemsByUserQuery__
 *
 * To run a query within a React component, call `useItemsByUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useItemsByUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useItemsByUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      category: // value for 'category'
 *      isExchangePointItem: // value for 'isExchangePointItem'
 *   },
 * });
 */
export function useItemsByUserQuery(baseOptions: Apollo.QueryHookOptions<ItemsByUserQuery, ItemsByUserQueryVariables> & ({ variables: ItemsByUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ItemsByUserQuery, ItemsByUserQueryVariables>(ItemsByUserDocument, options);
      }
export function useItemsByUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ItemsByUserQuery, ItemsByUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ItemsByUserQuery, ItemsByUserQueryVariables>(ItemsByUserDocument, options);
        }
export function useItemsByUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ItemsByUserQuery, ItemsByUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ItemsByUserQuery, ItemsByUserQueryVariables>(ItemsByUserDocument, options);
        }
export type ItemsByUserQueryHookResult = ReturnType<typeof useItemsByUserQuery>;
export type ItemsByUserLazyQueryHookResult = ReturnType<typeof useItemsByUserLazyQuery>;
export type ItemsByUserSuspenseQueryHookResult = ReturnType<typeof useItemsByUserSuspenseQuery>;
export type ItemsByUserQueryResult = Apollo.QueryResult<ItemsByUserQuery, ItemsByUserQueryVariables>;
export const TotalItemsByUserDocument = gql`
    query TotalItemsByUser($userId: ID!, $category: [String!], $isExchangePointItem: Boolean) {
  totalItemsCountByUser(
    userId: $userId
    category: $category
    isExchangePointItem: $isExchangePointItem
  )
}
    `;

/**
 * __useTotalItemsByUserQuery__
 *
 * To run a query within a React component, call `useTotalItemsByUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useTotalItemsByUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTotalItemsByUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      category: // value for 'category'
 *      isExchangePointItem: // value for 'isExchangePointItem'
 *   },
 * });
 */
export function useTotalItemsByUserQuery(baseOptions: Apollo.QueryHookOptions<TotalItemsByUserQuery, TotalItemsByUserQueryVariables> & ({ variables: TotalItemsByUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>(TotalItemsByUserDocument, options);
      }
export function useTotalItemsByUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>(TotalItemsByUserDocument, options);
        }
export function useTotalItemsByUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>(TotalItemsByUserDocument, options);
        }
export type TotalItemsByUserQueryHookResult = ReturnType<typeof useTotalItemsByUserQuery>;
export type TotalItemsByUserLazyQueryHookResult = ReturnType<typeof useTotalItemsByUserLazyQuery>;
export type TotalItemsByUserSuspenseQueryHookResult = ReturnType<typeof useTotalItemsByUserSuspenseQuery>;
export type TotalItemsByUserQueryResult = Apollo.QueryResult<TotalItemsByUserQuery, TotalItemsByUserQueryVariables>;
export const UserRootBinderDocument = gql`
    query UserRootBinder($binderId: ID!) {
  binder(id: $binderId) {
    id
    name
    description
    images
    thumbnails
    binds {
      type
      id
      name
    }
    bindedCount
    updatedAt
    owner {
      id
      nickname
      email
    }
  }
}
    `;

/**
 * __useUserRootBinderQuery__
 *
 * To run a query within a React component, call `useUserRootBinderQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserRootBinderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserRootBinderQuery({
 *   variables: {
 *      binderId: // value for 'binderId'
 *   },
 * });
 */
export function useUserRootBinderQuery(baseOptions: Apollo.QueryHookOptions<UserRootBinderQuery, UserRootBinderQueryVariables> & ({ variables: UserRootBinderQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserRootBinderQuery, UserRootBinderQueryVariables>(UserRootBinderDocument, options);
      }
export function useUserRootBinderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserRootBinderQuery, UserRootBinderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserRootBinderQuery, UserRootBinderQueryVariables>(UserRootBinderDocument, options);
        }
export function useUserRootBinderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserRootBinderQuery, UserRootBinderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserRootBinderQuery, UserRootBinderQueryVariables>(UserRootBinderDocument, options);
        }
export type UserRootBinderQueryHookResult = ReturnType<typeof useUserRootBinderQuery>;
export type UserRootBinderLazyQueryHookResult = ReturnType<typeof useUserRootBinderLazyQuery>;
export type UserRootBinderSuspenseQueryHookResult = ReturnType<typeof useUserRootBinderSuspenseQuery>;
export type UserRootBinderQueryResult = Apollo.QueryResult<UserRootBinderQuery, UserRootBinderQueryVariables>;
export const GeocodeAddressDocument = gql`
    query GeocodeAddress($address: String!) {
  geocodeAddress(address: $address) {
    latitude
    longitude
    geohash
  }
}
    `;

/**
 * __useGeocodeAddressQuery__
 *
 * To run a query within a React component, call `useGeocodeAddressQuery` and pass it any options that fit your needs.
 * When your component renders, `useGeocodeAddressQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGeocodeAddressQuery({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useGeocodeAddressQuery(baseOptions: Apollo.QueryHookOptions<GeocodeAddressQuery, GeocodeAddressQueryVariables> & ({ variables: GeocodeAddressQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GeocodeAddressQuery, GeocodeAddressQueryVariables>(GeocodeAddressDocument, options);
      }
export function useGeocodeAddressLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GeocodeAddressQuery, GeocodeAddressQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GeocodeAddressQuery, GeocodeAddressQueryVariables>(GeocodeAddressDocument, options);
        }
export function useGeocodeAddressSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GeocodeAddressQuery, GeocodeAddressQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GeocodeAddressQuery, GeocodeAddressQueryVariables>(GeocodeAddressDocument, options);
        }
export type GeocodeAddressQueryHookResult = ReturnType<typeof useGeocodeAddressQuery>;
export type GeocodeAddressLazyQueryHookResult = ReturnType<typeof useGeocodeAddressLazyQuery>;
export type GeocodeAddressSuspenseQueryHookResult = ReturnType<typeof useGeocodeAddressSuspenseQuery>;
export type GeocodeAddressQueryResult = Apollo.QueryResult<GeocodeAddressQuery, GeocodeAddressQueryVariables>;
export const UserDocument = gql`
    query User($userId: ID!) {
  user(id: $userId) {
    createdAt
    email
    id
    nickname
    address
    isVerified
    isActive
    role
    exchangePoints
    visibleContentRating
    itemCategory {
      category
      count
    }
    contactMethods {
      type
      value
      isPublic
    }
    location {
      latitude
      longitude
    }
    pinItems {
      id
      name
      condition
      status
      images
      thumbnails
      category
      location {
        latitude
        longitude
      }
    }
  }
}
    `;

/**
 * __useUserQuery__
 *
 * To run a query within a React component, call `useUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useUserQuery(baseOptions: Apollo.QueryHookOptions<UserQuery, UserQueryVariables> & ({ variables: UserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<UserQuery, UserQueryVariables>(UserDocument, options);
      }
export function useUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<UserQuery, UserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<UserQuery, UserQueryVariables>(UserDocument, options);
        }
export function useUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<UserQuery, UserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<UserQuery, UserQueryVariables>(UserDocument, options);
        }
export type UserQueryHookResult = ReturnType<typeof useUserQuery>;
export type UserLazyQueryHookResult = ReturnType<typeof useUserLazyQuery>;
export type UserSuspenseQueryHookResult = ReturnType<typeof useUserSuspenseQuery>;
export type UserQueryResult = Apollo.QueryResult<UserQuery, UserQueryVariables>;
export const UpdateUserDocument = gql`
    mutation UpdateUser($address: String, $nickname: String, $exchangePoints: [String!], $contactMethods: [ContactMethodInput!], $visibleContentRating: Int) {
  updateUser(
    address: $address
    nickname: $nickname
    exchangePoints: $exchangePoints
    contactMethods: $contactMethods
    visibleContentRating: $visibleContentRating
  ) {
    id
    address
    nickname
    createdAt
    location {
      latitude
      longitude
      geohash
    }
    contactMethods {
      type
      value
      isPublic
    }
    isVerified
    isActive
    exchangePoints
    visibleContentRating
  }
}
    `;
export type UpdateUserMutationFn = Apollo.MutationFunction<UpdateUserMutation, UpdateUserMutationVariables>;

/**
 * __useUpdateUserMutation__
 *
 * To run a mutation, you first call `useUpdateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateUserMutation, { data, loading, error }] = useUpdateUserMutation({
 *   variables: {
 *      address: // value for 'address'
 *      nickname: // value for 'nickname'
 *      exchangePoints: // value for 'exchangePoints'
 *      contactMethods: // value for 'contactMethods'
 *      visibleContentRating: // value for 'visibleContentRating'
 *   },
 * });
 */
export function useUpdateUserMutation(baseOptions?: Apollo.MutationHookOptions<UpdateUserMutation, UpdateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateUserMutation, UpdateUserMutationVariables>(UpdateUserDocument, options);
      }
export type UpdateUserMutationHookResult = ReturnType<typeof useUpdateUserMutation>;
export type UpdateUserMutationResult = Apollo.MutationResult<UpdateUserMutation>;
export type UpdateUserMutationOptions = Apollo.BaseMutationOptions<UpdateUserMutation, UpdateUserMutationVariables>;
export const GetExchangePointsDocument = gql`
    query GetExchangePoints($limit: Int, $offset: Int) {
  exchangePoints(limit: $limit, offset: $offset) {
    id
    nickname
    address
    location {
      latitude
      longitude
      geohash
    }
  }
}
    `;

/**
 * __useGetExchangePointsQuery__
 *
 * To run a query within a React component, call `useGetExchangePointsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetExchangePointsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetExchangePointsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetExchangePointsQuery(baseOptions?: Apollo.QueryHookOptions<GetExchangePointsQuery, GetExchangePointsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetExchangePointsQuery, GetExchangePointsQueryVariables>(GetExchangePointsDocument, options);
      }
export function useGetExchangePointsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetExchangePointsQuery, GetExchangePointsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetExchangePointsQuery, GetExchangePointsQueryVariables>(GetExchangePointsDocument, options);
        }
export function useGetExchangePointsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetExchangePointsQuery, GetExchangePointsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetExchangePointsQuery, GetExchangePointsQueryVariables>(GetExchangePointsDocument, options);
        }
export type GetExchangePointsQueryHookResult = ReturnType<typeof useGetExchangePointsQuery>;
export type GetExchangePointsLazyQueryHookResult = ReturnType<typeof useGetExchangePointsLazyQuery>;
export type GetExchangePointsSuspenseQueryHookResult = ReturnType<typeof useGetExchangePointsSuspenseQuery>;
export type GetExchangePointsQueryResult = Apollo.QueryResult<GetExchangePointsQuery, GetExchangePointsQueryVariables>;
export const CreateUserDocument = gql`
    mutation CreateUser($email: String!, $address: String, $nickname: String, $visibleContentRating: Int) {
  createUser(
    email: $email
    address: $address
    nickname: $nickname
    visibleContentRating: $visibleContentRating
  ) {
    id
    email
    address
    nickname
    createdAt
    location {
      latitude
      longitude
      geohash
    }
    isVerified
    isActive
    visibleContentRating
  }
}
    `;
export type CreateUserMutationFn = Apollo.MutationFunction<CreateUserMutation, CreateUserMutationVariables>;

/**
 * __useCreateUserMutation__
 *
 * To run a mutation, you first call `useCreateUserMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateUserMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createUserMutation, { data, loading, error }] = useCreateUserMutation({
 *   variables: {
 *      email: // value for 'email'
 *      address: // value for 'address'
 *      nickname: // value for 'nickname'
 *      visibleContentRating: // value for 'visibleContentRating'
 *   },
 * });
 */
export function useCreateUserMutation(baseOptions?: Apollo.MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateUserMutation, CreateUserMutationVariables>(CreateUserDocument, options);
      }
export type CreateUserMutationHookResult = ReturnType<typeof useCreateUserMutation>;
export type CreateUserMutationResult = Apollo.MutationResult<CreateUserMutation>;
export type CreateUserMutationOptions = Apollo.BaseMutationOptions<CreateUserMutation, CreateUserMutationVariables>;
export const GetOnLoanItemsByHolderDocument = gql`
    query GetOnLoanItemsByHolder($userId: ID!, $limit: Int!, $offset: Int!) {
  itemsOnLoanByHolder(userId: $userId, limit: $limit, offset: $offset) {
    id
    name
    description
    condition
    images
    updatedAt
    createdAt
    ownerId
    holderId
    status
    deposit
  }
}
    `;

/**
 * __useGetOnLoanItemsByHolderQuery__
 *
 * To run a query within a React component, call `useGetOnLoanItemsByHolderQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOnLoanItemsByHolderQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOnLoanItemsByHolderQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOnLoanItemsByHolderQuery(baseOptions: Apollo.QueryHookOptions<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables> & ({ variables: GetOnLoanItemsByHolderQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>(GetOnLoanItemsByHolderDocument, options);
      }
export function useGetOnLoanItemsByHolderLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>(GetOnLoanItemsByHolderDocument, options);
        }
export function useGetOnLoanItemsByHolderSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>(GetOnLoanItemsByHolderDocument, options);
        }
export type GetOnLoanItemsByHolderQueryHookResult = ReturnType<typeof useGetOnLoanItemsByHolderQuery>;
export type GetOnLoanItemsByHolderLazyQueryHookResult = ReturnType<typeof useGetOnLoanItemsByHolderLazyQuery>;
export type GetOnLoanItemsByHolderSuspenseQueryHookResult = ReturnType<typeof useGetOnLoanItemsByHolderSuspenseQuery>;
export type GetOnLoanItemsByHolderQueryResult = Apollo.QueryResult<GetOnLoanItemsByHolderQuery, GetOnLoanItemsByHolderQueryVariables>;
export const GetUserDocument = gql`
    query GetUser($id: ID!) {
  user(id: $id) {
    id
    nickname
    email
  }
}
    `;

/**
 * __useGetUserQuery__
 *
 * To run a query within a React component, call `useGetUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetUserQuery(baseOptions: Apollo.QueryHookOptions<GetUserQuery, GetUserQueryVariables> & ({ variables: GetUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
      }
export function useGetUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export function useGetUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserQuery, GetUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserQuery, GetUserQueryVariables>(GetUserDocument, options);
        }
export type GetUserQueryHookResult = ReturnType<typeof useGetUserQuery>;
export type GetUserLazyQueryHookResult = ReturnType<typeof useGetUserLazyQuery>;
export type GetUserSuspenseQueryHookResult = ReturnType<typeof useGetUserSuspenseQuery>;
export type GetUserQueryResult = Apollo.QueryResult<GetUserQuery, GetUserQueryVariables>;
export const GetExchangePointsCountDocument = gql`
    query GetExchangePointsCount {
  exchangePointsCount
}
    `;

/**
 * __useGetExchangePointsCountQuery__
 *
 * To run a query within a React component, call `useGetExchangePointsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetExchangePointsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetExchangePointsCountQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetExchangePointsCountQuery(baseOptions?: Apollo.QueryHookOptions<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>(GetExchangePointsCountDocument, options);
      }
export function useGetExchangePointsCountLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>(GetExchangePointsCountDocument, options);
        }
export function useGetExchangePointsCountSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>(GetExchangePointsCountDocument, options);
        }
export type GetExchangePointsCountQueryHookResult = ReturnType<typeof useGetExchangePointsCountQuery>;
export type GetExchangePointsCountLazyQueryHookResult = ReturnType<typeof useGetExchangePointsCountLazyQuery>;
export type GetExchangePointsCountSuspenseQueryHookResult = ReturnType<typeof useGetExchangePointsCountSuspenseQuery>;
export type GetExchangePointsCountQueryResult = Apollo.QueryResult<GetExchangePointsCountQuery, GetExchangePointsCountQueryVariables>;
export const DuplicateTitlesByUserDocument = gql`
    query DuplicateTitlesByUser($userId: ID!, $names: [String!]!) {
  duplicateTitlesByUser(userId: $userId, names: $names)
}
    `;

/**
 * __useDuplicateTitlesByUserQuery__
 *
 * To run a query within a React component, call `useDuplicateTitlesByUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useDuplicateTitlesByUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDuplicateTitlesByUserQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      names: // value for 'names'
 *   },
 * });
 */
export function useDuplicateTitlesByUserQuery(baseOptions: Apollo.QueryHookOptions<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables> & ({ variables: DuplicateTitlesByUserQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>(DuplicateTitlesByUserDocument, options);
      }
export function useDuplicateTitlesByUserLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>(DuplicateTitlesByUserDocument, options);
        }
export function useDuplicateTitlesByUserSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>(DuplicateTitlesByUserDocument, options);
        }
export type DuplicateTitlesByUserQueryHookResult = ReturnType<typeof useDuplicateTitlesByUserQuery>;
export type DuplicateTitlesByUserLazyQueryHookResult = ReturnType<typeof useDuplicateTitlesByUserLazyQuery>;
export type DuplicateTitlesByUserSuspenseQueryHookResult = ReturnType<typeof useDuplicateTitlesByUserSuspenseQuery>;
export type DuplicateTitlesByUserQueryResult = Apollo.QueryResult<DuplicateTitlesByUserQuery, DuplicateTitlesByUserQueryVariables>;
export const CreateItemsFromJsonDocument = gql`
    mutation CreateItemsFromJSON($bookJson: [String!]!, $deposit: Int! = 0) {
  createItemsFromJSON(bookJson: $bookJson, deposit: $deposit) {
    id
    name
  }
}
    `;
export type CreateItemsFromJsonMutationFn = Apollo.MutationFunction<CreateItemsFromJsonMutation, CreateItemsFromJsonMutationVariables>;

/**
 * __useCreateItemsFromJsonMutation__
 *
 * To run a mutation, you first call `useCreateItemsFromJsonMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateItemsFromJsonMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createItemsFromJsonMutation, { data, loading, error }] = useCreateItemsFromJsonMutation({
 *   variables: {
 *      bookJson: // value for 'bookJson'
 *      deposit: // value for 'deposit'
 *   },
 * });
 */
export function useCreateItemsFromJsonMutation(baseOptions?: Apollo.MutationHookOptions<CreateItemsFromJsonMutation, CreateItemsFromJsonMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateItemsFromJsonMutation, CreateItemsFromJsonMutationVariables>(CreateItemsFromJsonDocument, options);
      }
export type CreateItemsFromJsonMutationHookResult = ReturnType<typeof useCreateItemsFromJsonMutation>;
export type CreateItemsFromJsonMutationResult = Apollo.MutationResult<CreateItemsFromJsonMutation>;
export type CreateItemsFromJsonMutationOptions = Apollo.BaseMutationOptions<CreateItemsFromJsonMutation, CreateItemsFromJsonMutationVariables>;
export const RecentCategoriesDocument = gql`
    query RecentCategories($limit: Int!) {
  recentUpdateCategories(limit: $limit)
}
    `;

/**
 * __useRecentCategoriesQuery__
 *
 * To run a query within a React component, call `useRecentCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentCategoriesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecentCategoriesQuery(baseOptions: Apollo.QueryHookOptions<RecentCategoriesQuery, RecentCategoriesQueryVariables> & ({ variables: RecentCategoriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecentCategoriesQuery, RecentCategoriesQueryVariables>(RecentCategoriesDocument, options);
      }
export function useRecentCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecentCategoriesQuery, RecentCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecentCategoriesQuery, RecentCategoriesQueryVariables>(RecentCategoriesDocument, options);
        }
export function useRecentCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentCategoriesQuery, RecentCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecentCategoriesQuery, RecentCategoriesQueryVariables>(RecentCategoriesDocument, options);
        }
export type RecentCategoriesQueryHookResult = ReturnType<typeof useRecentCategoriesQuery>;
export type RecentCategoriesLazyQueryHookResult = ReturnType<typeof useRecentCategoriesLazyQuery>;
export type RecentCategoriesSuspenseQueryHookResult = ReturnType<typeof useRecentCategoriesSuspenseQuery>;
export type RecentCategoriesQueryResult = Apollo.QueryResult<RecentCategoriesQuery, RecentCategoriesQueryVariables>;
export const HotCategoriesDocument = gql`
    query HotCategories($limit: Int!) {
  hotCategories(limit: $limit)
}
    `;

/**
 * __useHotCategoriesQuery__
 *
 * To run a query within a React component, call `useHotCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useHotCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useHotCategoriesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useHotCategoriesQuery(baseOptions: Apollo.QueryHookOptions<HotCategoriesQuery, HotCategoriesQueryVariables> & ({ variables: HotCategoriesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<HotCategoriesQuery, HotCategoriesQueryVariables>(HotCategoriesDocument, options);
      }
export function useHotCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<HotCategoriesQuery, HotCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<HotCategoriesQuery, HotCategoriesQueryVariables>(HotCategoriesDocument, options);
        }
export function useHotCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<HotCategoriesQuery, HotCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<HotCategoriesQuery, HotCategoriesQueryVariables>(HotCategoriesDocument, options);
        }
export type HotCategoriesQueryHookResult = ReturnType<typeof useHotCategoriesQuery>;
export type HotCategoriesLazyQueryHookResult = ReturnType<typeof useHotCategoriesLazyQuery>;
export type HotCategoriesSuspenseQueryHookResult = ReturnType<typeof useHotCategoriesSuspenseQuery>;
export type HotCategoriesQueryResult = Apollo.QueryResult<HotCategoriesQuery, HotCategoriesQueryVariables>;
export const RecommendedItemsDocument = gql`
    query RecommendedItems($type: RecommendationType!, $limit: Int!) {
  recommendedItems(type: $type, limit: $limit) {
    id
    name
    category
    status
    images
    thumbnails
    condition
    location {
      latitude
      longitude
    }
    ownerId
  }
}
    `;

/**
 * __useRecommendedItemsQuery__
 *
 * To run a query within a React component, call `useRecommendedItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecommendedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecommendedItemsQuery({
 *   variables: {
 *      type: // value for 'type'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useRecommendedItemsQuery(baseOptions: Apollo.QueryHookOptions<RecommendedItemsQuery, RecommendedItemsQueryVariables> & ({ variables: RecommendedItemsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecommendedItemsQuery, RecommendedItemsQueryVariables>(RecommendedItemsDocument, options);
      }
export function useRecommendedItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecommendedItemsQuery, RecommendedItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecommendedItemsQuery, RecommendedItemsQueryVariables>(RecommendedItemsDocument, options);
        }
export function useRecommendedItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecommendedItemsQuery, RecommendedItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecommendedItemsQuery, RecommendedItemsQueryVariables>(RecommendedItemsDocument, options);
        }
export type RecommendedItemsQueryHookResult = ReturnType<typeof useRecommendedItemsQuery>;
export type RecommendedItemsLazyQueryHookResult = ReturnType<typeof useRecommendedItemsLazyQuery>;
export type RecommendedItemsSuspenseQueryHookResult = ReturnType<typeof useRecommendedItemsSuspenseQuery>;
export type RecommendedItemsQueryResult = Apollo.QueryResult<RecommendedItemsQuery, RecommendedItemsQueryVariables>;
export const ItemsByLocationDocument = gql`
    query ItemsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!, $classifications: [String!], $category: [String!], $keyword: String, $limit: Int, $offset: Int) {
  itemsByLocation(
    latitude: $latitude
    longitude: $longitude
    radiusKm: $radiusKm
    classifications: $classifications
    category: $category
    keyword: $keyword
    limit: $limit
    offset: $offset
  ) {
    id
    name
    description
    condition
    status
    location {
      latitude
      longitude
    }
    images
    thumbnails
    category
    clssfctns
    publishedYear
    language
    createdAt
  }
}
    `;

/**
 * __useItemsByLocationQuery__
 *
 * To run a query within a React component, call `useItemsByLocationQuery` and pass it any options that fit your needs.
 * When your component renders, `useItemsByLocationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useItemsByLocationQuery({
 *   variables: {
 *      latitude: // value for 'latitude'
 *      longitude: // value for 'longitude'
 *      radiusKm: // value for 'radiusKm'
 *      classifications: // value for 'classifications'
 *      category: // value for 'category'
 *      keyword: // value for 'keyword'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useItemsByLocationQuery(baseOptions: Apollo.QueryHookOptions<ItemsByLocationQuery, ItemsByLocationQueryVariables> & ({ variables: ItemsByLocationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ItemsByLocationQuery, ItemsByLocationQueryVariables>(ItemsByLocationDocument, options);
      }
export function useItemsByLocationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ItemsByLocationQuery, ItemsByLocationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ItemsByLocationQuery, ItemsByLocationQueryVariables>(ItemsByLocationDocument, options);
        }
export function useItemsByLocationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ItemsByLocationQuery, ItemsByLocationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ItemsByLocationQuery, ItemsByLocationQueryVariables>(ItemsByLocationDocument, options);
        }
export type ItemsByLocationQueryHookResult = ReturnType<typeof useItemsByLocationQuery>;
export type ItemsByLocationLazyQueryHookResult = ReturnType<typeof useItemsByLocationLazyQuery>;
export type ItemsByLocationSuspenseQueryHookResult = ReturnType<typeof useItemsByLocationSuspenseQuery>;
export type ItemsByLocationQueryResult = Apollo.QueryResult<ItemsByLocationQuery, ItemsByLocationQueryVariables>;
export const TotalItemsCountByLocationDocument = gql`
    query TotalItemsCountByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!, $classifications: [String!], $category: [String!], $keyword: String) {
  totalItemsCountByLocation(
    latitude: $latitude
    longitude: $longitude
    radiusKm: $radiusKm
    classifications: $classifications
    category: $category
    keyword: $keyword
  )
}
    `;

/**
 * __useTotalItemsCountByLocationQuery__
 *
 * To run a query within a React component, call `useTotalItemsCountByLocationQuery` and pass it any options that fit your needs.
 * When your component renders, `useTotalItemsCountByLocationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTotalItemsCountByLocationQuery({
 *   variables: {
 *      latitude: // value for 'latitude'
 *      longitude: // value for 'longitude'
 *      radiusKm: // value for 'radiusKm'
 *      classifications: // value for 'classifications'
 *      category: // value for 'category'
 *      keyword: // value for 'keyword'
 *   },
 * });
 */
export function useTotalItemsCountByLocationQuery(baseOptions: Apollo.QueryHookOptions<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables> & ({ variables: TotalItemsCountByLocationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>(TotalItemsCountByLocationDocument, options);
      }
export function useTotalItemsCountByLocationLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>(TotalItemsCountByLocationDocument, options);
        }
export function useTotalItemsCountByLocationSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>(TotalItemsCountByLocationDocument, options);
        }
export type TotalItemsCountByLocationQueryHookResult = ReturnType<typeof useTotalItemsCountByLocationQuery>;
export type TotalItemsCountByLocationLazyQueryHookResult = ReturnType<typeof useTotalItemsCountByLocationLazyQuery>;
export type TotalItemsCountByLocationSuspenseQueryHookResult = ReturnType<typeof useTotalItemsCountByLocationSuspenseQuery>;
export type TotalItemsCountByLocationQueryResult = Apollo.QueryResult<TotalItemsCountByLocationQuery, TotalItemsCountByLocationQueryVariables>;
export const DefaultCategoriesDocument = gql`
    query DefaultCategories {
  defaultCategories
}
    `;

/**
 * __useDefaultCategoriesQuery__
 *
 * To run a query within a React component, call `useDefaultCategoriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useDefaultCategoriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDefaultCategoriesQuery({
 *   variables: {
 *   },
 * });
 */
export function useDefaultCategoriesQuery(baseOptions?: Apollo.QueryHookOptions<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>(DefaultCategoriesDocument, options);
      }
export function useDefaultCategoriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>(DefaultCategoriesDocument, options);
        }
export function useDefaultCategoriesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>(DefaultCategoriesDocument, options);
        }
export type DefaultCategoriesQueryHookResult = ReturnType<typeof useDefaultCategoriesQuery>;
export type DefaultCategoriesLazyQueryHookResult = ReturnType<typeof useDefaultCategoriesLazyQuery>;
export type DefaultCategoriesSuspenseQueryHookResult = ReturnType<typeof useDefaultCategoriesSuspenseQuery>;
export type DefaultCategoriesQueryResult = Apollo.QueryResult<DefaultCategoriesQuery, DefaultCategoriesQueryVariables>;
export const RecentAddedItemsDocument = gql`
    query RecentAddedItems($limit: Int, $offset: Int, $category: [String!]) {
  recentAddedItems(limit: $limit, offset: $offset, category: $category) {
    id
    name
    description
    condition
    category
    status
    images
    publishedYear
    language
    createdAt
  }
}
    `;

/**
 * __useRecentAddedItemsQuery__
 *
 * To run a query within a React component, call `useRecentAddedItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecentAddedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecentAddedItemsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      category: // value for 'category'
 *   },
 * });
 */
export function useRecentAddedItemsQuery(baseOptions?: Apollo.QueryHookOptions<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>(RecentAddedItemsDocument, options);
      }
export function useRecentAddedItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>(RecentAddedItemsDocument, options);
        }
export function useRecentAddedItemsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>(RecentAddedItemsDocument, options);
        }
export type RecentAddedItemsQueryHookResult = ReturnType<typeof useRecentAddedItemsQuery>;
export type RecentAddedItemsLazyQueryHookResult = ReturnType<typeof useRecentAddedItemsLazyQuery>;
export type RecentAddedItemsSuspenseQueryHookResult = ReturnType<typeof useRecentAddedItemsSuspenseQuery>;
export type RecentAddedItemsQueryResult = Apollo.QueryResult<RecentAddedItemsQuery, RecentAddedItemsQueryVariables>;
export const GetHostConfigDocument = gql`
    query GetHostConfig {
  hostConfig {
    chatLink
    aboutUsText
    splashScreenImageUrl
    splashScreenText
    itemShareMessageTemplates
  }
}
    `;

/**
 * __useGetHostConfigQuery__
 *
 * To run a query within a React component, call `useGetHostConfigQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetHostConfigQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetHostConfigQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetHostConfigQuery(baseOptions?: Apollo.QueryHookOptions<GetHostConfigQuery, GetHostConfigQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetHostConfigQuery, GetHostConfigQueryVariables>(GetHostConfigDocument, options);
      }
export function useGetHostConfigLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetHostConfigQuery, GetHostConfigQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetHostConfigQuery, GetHostConfigQueryVariables>(GetHostConfigDocument, options);
        }
export function useGetHostConfigSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetHostConfigQuery, GetHostConfigQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetHostConfigQuery, GetHostConfigQueryVariables>(GetHostConfigDocument, options);
        }
export type GetHostConfigQueryHookResult = ReturnType<typeof useGetHostConfigQuery>;
export type GetHostConfigLazyQueryHookResult = ReturnType<typeof useGetHostConfigLazyQuery>;
export type GetHostConfigSuspenseQueryHookResult = ReturnType<typeof useGetHostConfigSuspenseQuery>;
export type GetHostConfigQueryResult = Apollo.QueryResult<GetHostConfigQuery, GetHostConfigQueryVariables>;
export const UpdateHostConfigDocument = gql`
    mutation UpdateHostConfig($input: HostConfigInput!) {
  updateHostConfig(input: $input) {
    chatLink
    aboutUsText
    splashScreenImageUrl
    splashScreenText
    itemShareMessageTemplates
  }
}
    `;
export type UpdateHostConfigMutationFn = Apollo.MutationFunction<UpdateHostConfigMutation, UpdateHostConfigMutationVariables>;

/**
 * __useUpdateHostConfigMutation__
 *
 * To run a mutation, you first call `useUpdateHostConfigMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateHostConfigMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateHostConfigMutation, { data, loading, error }] = useUpdateHostConfigMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateHostConfigMutation(baseOptions?: Apollo.MutationHookOptions<UpdateHostConfigMutation, UpdateHostConfigMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateHostConfigMutation, UpdateHostConfigMutationVariables>(UpdateHostConfigDocument, options);
      }
export type UpdateHostConfigMutationHookResult = ReturnType<typeof useUpdateHostConfigMutation>;
export type UpdateHostConfigMutationResult = Apollo.MutationResult<UpdateHostConfigMutation>;
export type UpdateHostConfigMutationOptions = Apollo.BaseMutationOptions<UpdateHostConfigMutation, UpdateHostConfigMutationVariables>;
export const GetOnLoanItemsByOwnerDocument = gql`
    query GetOnLoanItemsByOwner($userId: ID!, $limit: Int!, $offset: Int!) {
  itemsOnLoanByOwner(userId: $userId, limit: $limit, offset: $offset) {
    id
    name
    description
    condition
    images
    updatedAt
    createdAt
    ownerId
    holderId
    status
    deposit
  }
}
    `;

/**
 * __useGetOnLoanItemsByOwnerQuery__
 *
 * To run a query within a React component, call `useGetOnLoanItemsByOwnerQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetOnLoanItemsByOwnerQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetOnLoanItemsByOwnerQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetOnLoanItemsByOwnerQuery(baseOptions: Apollo.QueryHookOptions<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables> & ({ variables: GetOnLoanItemsByOwnerQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>(GetOnLoanItemsByOwnerDocument, options);
      }
export function useGetOnLoanItemsByOwnerLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>(GetOnLoanItemsByOwnerDocument, options);
        }
export function useGetOnLoanItemsByOwnerSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>(GetOnLoanItemsByOwnerDocument, options);
        }
export type GetOnLoanItemsByOwnerQueryHookResult = ReturnType<typeof useGetOnLoanItemsByOwnerQuery>;
export type GetOnLoanItemsByOwnerLazyQueryHookResult = ReturnType<typeof useGetOnLoanItemsByOwnerLazyQuery>;
export type GetOnLoanItemsByOwnerSuspenseQueryHookResult = ReturnType<typeof useGetOnLoanItemsByOwnerSuspenseQuery>;
export type GetOnLoanItemsByOwnerQueryResult = Apollo.QueryResult<GetOnLoanItemsByOwnerQuery, GetOnLoanItemsByOwnerQueryVariables>;
export const GetUserTransactionsDocument = gql`
    query GetUserTransactions($userId: ID!) {
  transactionsByUser(userId: $userId) {
    id
    status
    createdAt
    updatedAt
    item {
      id
      name
      images
      thumbnails
      ownerId
      location {
        latitude
        longitude
      }
    }
    requestor {
      id
      nickname
      email
    }
  }
}
    `;

/**
 * __useGetUserTransactionsQuery__
 *
 * To run a query within a React component, call `useGetUserTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserTransactionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserTransactionsQuery(baseOptions: Apollo.QueryHookOptions<GetUserTransactionsQuery, GetUserTransactionsQueryVariables> & ({ variables: GetUserTransactionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>(GetUserTransactionsDocument, options);
      }
export function useGetUserTransactionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>(GetUserTransactionsDocument, options);
        }
export function useGetUserTransactionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>(GetUserTransactionsDocument, options);
        }
export type GetUserTransactionsQueryHookResult = ReturnType<typeof useGetUserTransactionsQuery>;
export type GetUserTransactionsLazyQueryHookResult = ReturnType<typeof useGetUserTransactionsLazyQuery>;
export type GetUserTransactionsSuspenseQueryHookResult = ReturnType<typeof useGetUserTransactionsSuspenseQuery>;
export type GetUserTransactionsQueryResult = Apollo.QueryResult<GetUserTransactionsQuery, GetUserTransactionsQueryVariables>;
export const GetUserOpenTransactionsDocument = gql`
    query GetUserOpenTransactions($userId: ID!) {
  openTransactionsByUser(userId: $userId) {
    id
    status
    createdAt
    updatedAt
    item {
      id
      name
      images
      thumbnails
      ownerId
      location {
        latitude
        longitude
      }
    }
    requestor {
      id
      nickname
      email
    }
  }
}
    `;

/**
 * __useGetUserOpenTransactionsQuery__
 *
 * To run a query within a React component, call `useGetUserOpenTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserOpenTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserOpenTransactionsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserOpenTransactionsQuery(baseOptions: Apollo.QueryHookOptions<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables> & ({ variables: GetUserOpenTransactionsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>(GetUserOpenTransactionsDocument, options);
      }
export function useGetUserOpenTransactionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>(GetUserOpenTransactionsDocument, options);
        }
export function useGetUserOpenTransactionsSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>(GetUserOpenTransactionsDocument, options);
        }
export type GetUserOpenTransactionsQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsQuery>;
export type GetUserOpenTransactionsLazyQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsLazyQuery>;
export type GetUserOpenTransactionsSuspenseQueryHookResult = ReturnType<typeof useGetUserOpenTransactionsSuspenseQuery>;
export type GetUserOpenTransactionsQueryResult = Apollo.QueryResult<GetUserOpenTransactionsQuery, GetUserOpenTransactionsQueryVariables>;
export const GenerateSignedUrlDocument = gql`
    mutation GenerateSignedUrl($fileName: String!, $contentType: String!, $folder: String) {
  generateSignedUrl(
    fileName: $fileName
    contentType: $contentType
    folder: $folder
  ) {
    signedUrl
    gsUrl
    expires
  }
}
    `;
export type GenerateSignedUrlMutationFn = Apollo.MutationFunction<GenerateSignedUrlMutation, GenerateSignedUrlMutationVariables>;

/**
 * __useGenerateSignedUrlMutation__
 *
 * To run a mutation, you first call `useGenerateSignedUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useGenerateSignedUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [generateSignedUrlMutation, { data, loading, error }] = useGenerateSignedUrlMutation({
 *   variables: {
 *      fileName: // value for 'fileName'
 *      contentType: // value for 'contentType'
 *      folder: // value for 'folder'
 *   },
 * });
 */
export function useGenerateSignedUrlMutation(baseOptions?: Apollo.MutationHookOptions<GenerateSignedUrlMutation, GenerateSignedUrlMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<GenerateSignedUrlMutation, GenerateSignedUrlMutationVariables>(GenerateSignedUrlDocument, options);
      }
export type GenerateSignedUrlMutationHookResult = ReturnType<typeof useGenerateSignedUrlMutation>;
export type GenerateSignedUrlMutationResult = Apollo.MutationResult<GenerateSignedUrlMutation>;
export type GenerateSignedUrlMutationOptions = Apollo.BaseMutationOptions<GenerateSignedUrlMutation, GenerateSignedUrlMutationVariables>;