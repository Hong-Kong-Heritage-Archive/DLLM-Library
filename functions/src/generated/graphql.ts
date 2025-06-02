import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
};

export type ContactMethod = {
  __typename?: 'ContactMethod';
  isPublic: Scalars['Boolean']['output'];
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type ContactMethodInput = {
  isPublic: Scalars['Boolean']['input'];
  type: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type Item = {
  __typename?: 'Item';
  category: Array<Scalars['String']['output']>;
  condition: ItemCondition;
  createdAt: Scalars['Date']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  language: Language;
  location?: Maybe<Location>;
  name: Scalars['String']['output'];
  ownerId: Scalars['ID']['output'];
  publishedYear?: Maybe<Scalars['Int']['output']>;
  status: ItemStatus;
  transactions?: Maybe<Array<Transaction>>;
  updatedAt: Scalars['Date']['output'];
};

export enum ItemCondition {
  Fair = 'FAIR',
  Good = 'GOOD',
  New = 'NEW',
  Poor = 'POOR'
}

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
  cancelTransaction: Scalars['Boolean']['output'];
  createItem: Item;
  createNewsPost: NewsPost;
  createTransaction: Transaction;
  createUser: User;
  deleteItem: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  hideNewsPost: Scalars['Boolean']['output'];
  updateItem: Item;
  updateNewsPost: NewsPost;
  updateTransaction: Transaction;
  updateUser: User;
};


export type MutationCancelTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationCreateItemArgs = {
  category: Array<Scalars['String']['input']>;
  condition: ItemCondition;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  language: Language;
  name: Scalars['String']['input'];
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status: ItemStatus;
};


export type MutationCreateNewsPostArgs = {
  content: Scalars['String']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
  relatedItemIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  tags?: InputMaybe<Array<Scalars['String']['input']>>;
  title: Scalars['String']['input'];
};


export type MutationCreateTransactionArgs = {
  itemId: Scalars['ID']['input'];
  status: TransactionStatus;
};


export type MutationCreateUserArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationHideNewsPostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateItemArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  condition?: InputMaybe<ItemCondition>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
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


export type MutationUpdateTransactionArgs = {
  id: Scalars['ID']['input'];
  status: TransactionStatus;
};


export type MutationUpdateUserArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  contactMethods?: InputMaybe<Array<ContactMethodInput>>;
  nickname?: InputMaybe<Scalars['String']['input']>;
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
  geocodeAddress?: Maybe<Location>;
  item?: Maybe<Item>;
  items: Array<Item>;
  itemsByLocation: Array<Item>;
  itemsByUser: Array<Item>;
  me?: Maybe<User>;
  newsPost?: Maybe<NewsPost>;
  newsRecentPosts: Array<NewsPost>;
  recentAddedItems: Array<Item>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryGeocodeAddressArgs = {
  address: Scalars['String']['input'];
};


export type QueryItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryItemsArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  keyword?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
};


export type QueryItemsByLocationArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
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


export type QueryRecentAddedItemsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTransactionsArgs = {
  itemId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export enum Role {
  Admin = 'ADMIN',
  Moderator = 'MODERATOR',
  User = 'USER'
}

export type Transaction = {
  __typename?: 'Transaction';
  borrower?: Maybe<User>;
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  item: Item;
  status: TransactionStatus;
  updatedAt: Scalars['Date']['output'];
};

export enum TransactionStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Pending = 'PENDING'
}

export type User = {
  __typename?: 'User';
  address?: Maybe<Scalars['String']['output']>;
  contactMethods?: Maybe<Array<ContactMethod>>;
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isVerified: Scalars['Boolean']['output'];
  location?: Maybe<Location>;
  nickname?: Maybe<Scalars['String']['output']>;
  role: Role;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  ContactMethod: ResolverTypeWrapper<ContactMethod>;
  ContactMethodInput: ContactMethodInput;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Item: ResolverTypeWrapper<Item>;
  ItemCondition: ItemCondition;
  ItemStatus: ItemStatus;
  Language: Language;
  Location: ResolverTypeWrapper<Location>;
  LocationInput: LocationInput;
  Mutation: ResolverTypeWrapper<{}>;
  NewsPost: ResolverTypeWrapper<NewsPost>;
  Query: ResolverTypeWrapper<{}>;
  Role: Role;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Transaction: ResolverTypeWrapper<Transaction>;
  TransactionStatus: TransactionStatus;
  User: ResolverTypeWrapper<User>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  ContactMethod: ContactMethod;
  ContactMethodInput: ContactMethodInput;
  Date: Scalars['Date']['output'];
  Float: Scalars['Float']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Item: Item;
  Location: Location;
  LocationInput: LocationInput;
  Mutation: {};
  NewsPost: NewsPost;
  Query: {};
  String: Scalars['String']['output'];
  Transaction: Transaction;
  User: User;
};

export type ContactMethodResolvers<ContextType = any, ParentType extends ResolversParentTypes['ContactMethod'] = ResolversParentTypes['ContactMethod']> = {
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type ItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['Item'] = ResolversParentTypes['Item']> = {
  category?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  condition?: Resolver<ResolversTypes['ItemCondition'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  language?: Resolver<ResolversTypes['Language'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['Location']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  ownerId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  publishedYear?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['ItemStatus'], ParentType, ContextType>;
  transactions?: Resolver<Maybe<Array<ResolversTypes['Transaction']>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LocationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Location'] = ResolversParentTypes['Location']> = {
  geohash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  latitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  longitude?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  cancelTransaction?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationCancelTransactionArgs, 'id'>>;
  createItem?: Resolver<ResolversTypes['Item'], ParentType, ContextType, RequireFields<MutationCreateItemArgs, 'category' | 'condition' | 'language' | 'name' | 'status'>>;
  createNewsPost?: Resolver<ResolversTypes['NewsPost'], ParentType, ContextType, RequireFields<MutationCreateNewsPostArgs, 'content' | 'title'>>;
  createTransaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType, RequireFields<MutationCreateTransactionArgs, 'itemId' | 'status'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'email'>>;
  deleteItem?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteItemArgs, 'id'>>;
  deleteUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'id'>>;
  hideNewsPost?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationHideNewsPostArgs, 'id'>>;
  updateItem?: Resolver<ResolversTypes['Item'], ParentType, ContextType, RequireFields<MutationUpdateItemArgs, 'id'>>;
  updateNewsPost?: Resolver<ResolversTypes['NewsPost'], ParentType, ContextType, RequireFields<MutationUpdateNewsPostArgs, 'id'>>;
  updateTransaction?: Resolver<ResolversTypes['Transaction'], ParentType, ContextType, RequireFields<MutationUpdateTransactionArgs, 'id' | 'status'>>;
  updateUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, Partial<MutationUpdateUserArgs>>;
};

export type NewsPostResolvers<ContextType = any, ParentType extends ResolversParentTypes['NewsPost'] = ResolversParentTypes['NewsPost']> = {
  content?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  images?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  isVisible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  relatedItems?: Resolver<Maybe<Array<ResolversTypes['Item']>>, ParentType, ContextType>;
  tags?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  geocodeAddress?: Resolver<Maybe<ResolversTypes['Location']>, ParentType, ContextType, RequireFields<QueryGeocodeAddressArgs, 'address'>>;
  item?: Resolver<Maybe<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QueryItemArgs, 'id'>>;
  items?: Resolver<Array<ResolversTypes['Item']>, ParentType, ContextType, Partial<QueryItemsArgs>>;
  itemsByLocation?: Resolver<Array<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QueryItemsByLocationArgs, 'latitude' | 'longitude' | 'radiusKm'>>;
  itemsByUser?: Resolver<Array<ResolversTypes['Item']>, ParentType, ContextType, RequireFields<QueryItemsByUserArgs, 'userId'>>;
  me?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  newsPost?: Resolver<Maybe<ResolversTypes['NewsPost']>, ParentType, ContextType, RequireFields<QueryNewsPostArgs, 'id'>>;
  newsRecentPosts?: Resolver<Array<ResolversTypes['NewsPost']>, ParentType, ContextType, Partial<QueryNewsRecentPostsArgs>>;
  recentAddedItems?: Resolver<Array<ResolversTypes['Item']>, ParentType, ContextType, Partial<QueryRecentAddedItemsArgs>>;
  transaction?: Resolver<Maybe<ResolversTypes['Transaction']>, ParentType, ContextType, RequireFields<QueryTransactionArgs, 'id'>>;
  transactions?: Resolver<Array<ResolversTypes['Transaction']>, ParentType, ContextType, Partial<QueryTransactionsArgs>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryUsersArgs>>;
};

export type TransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Transaction'] = ResolversParentTypes['Transaction']> = {
  borrower?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  item?: Resolver<ResolversTypes['Item'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TransactionStatus'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  address?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  contactMethods?: Resolver<Maybe<Array<ResolversTypes['ContactMethod']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['Location']>, ParentType, ContextType>;
  nickname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes['Role'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  ContactMethod?: ContactMethodResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Item?: ItemResolvers<ContextType>;
  Location?: LocationResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NewsPost?: NewsPostResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Transaction?: TransactionResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
};

