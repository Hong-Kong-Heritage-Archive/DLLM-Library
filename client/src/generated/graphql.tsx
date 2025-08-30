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
};

export type Category = {
  __typename?: 'Category';
  category: Scalars['String']['output'];
  count: Scalars['Int']['output'];
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
  holderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  images?: Maybe<Array<Scalars['String']['output']>>;
  language: Language;
  location?: Maybe<Location>;
  name: Scalars['String']['output'];
  ownerId: Scalars['ID']['output'];
  publishedYear?: Maybe<Scalars['Int']['output']>;
  status: ItemStatus;
  thumbnails?: Maybe<Array<Scalars['String']['output']>>;
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
  approveTransaction: Transaction;
  cancelTransaction: Scalars['Boolean']['output'];
  createItem: Item;
  createNewsPost: NewsPost;
  createTransaction: Transaction;
  createUser: User;
  deleteItem: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  generateSignedUrl: SignedUrlResponse;
  hideNewsPost: Scalars['Boolean']['output'];
  receiveTransaction: Transaction;
  transferTransaction: Transaction;
  updateItem: Item;
  updateNewsPost: NewsPost;
  updateUser: User;
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


export type MutationGenerateSignedUrlArgs = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
};


export type MutationHideNewsPostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationReceiveTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationTransferTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateItemArgs = {
  category?: InputMaybe<Array<Scalars['String']['input']>>;
  condition?: InputMaybe<ItemCondition>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  images?: InputMaybe<Array<Scalars['String']['input']>>;
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
  defaultCategories: Array<Scalars['String']['output']>;
  exchangePoints: Array<User>;
  geocodeAddress?: Maybe<Location>;
  hotCategories: Array<Scalars['String']['output']>;
  item?: Maybe<Item>;
  items: Array<Item>;
  itemsByLocation: Array<Item>;
  itemsByUser: Array<Item>;
  me?: Maybe<User>;
  newsPost?: Maybe<NewsPost>;
  newsRecentPosts: Array<NewsPost>;
  openTransactionsByItem: Array<Transaction>;
  openTransactionsByUser: Array<Transaction>;
  recentAddedItems: Array<Item>;
  recentUpdateCategories: Array<Scalars['String']['output']>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  transactionsByItem: Array<Transaction>;
  transactionsByUser: Array<Transaction>;
  user?: Maybe<User>;
  users: Array<User>;
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


export type QueryRecentUpdateCategoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
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
  id: Scalars['ID']['output'];
  item: Item;
  requestor?: Maybe<User>;
  status: TransactionStatus;
  updatedAt: Scalars['Date']['output'];
};

export enum TransactionStatus {
  Approved = 'APPROVED',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
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
  role: Role;
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', address?: string | null, createdAt: any, email: string, id: string, isVerified: boolean, isActive: boolean, role: Role, nickname?: string | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type UpdateItemMutationVariables = Exact<{
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  condition?: InputMaybe<ItemCondition>;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  language?: InputMaybe<Language>;
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<ItemStatus>;
}>;


export type UpdateItemMutation = { __typename?: 'Mutation', updateItem: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, updatedAt: any } };

export type ItemQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type ItemQuery = { __typename?: 'Query', item?: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, holderId?: string | null } | null };

export type CreateTransactionMutationVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type CreateTransactionMutation = { __typename?: 'Mutation', createTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any } };

export type GetUserForItemQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type GetUserForItemQuery = { __typename?: 'Query', user?: { __typename?: 'User', createdAt: any, email: string, id: string, nickname?: string | null, address?: string | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: string, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type OpenTransactionsByItemQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type OpenTransactionsByItemQuery = { __typename?: 'Query', openTransactionsByItem: Array<{ __typename?: 'Transaction', id: string, status: TransactionStatus, createdAt: any, updatedAt: any, requestor?: { __typename?: 'User', id: string, nickname?: string | null, email: string } | null }> };

export type ApproveTransactionMutationVariables = Exact<{
  transactionId: Scalars['ID']['input'];
}>;


export type ApproveTransactionMutation = { __typename?: 'Mutation', approveTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any } };

export type CancelTransactionMutationVariables = Exact<{
  transactionId: Scalars['ID']['input'];
}>;


export type CancelTransactionMutation = { __typename?: 'Mutation', cancelTransaction: boolean };

export type TransferTransactionMutationVariables = Exact<{
  transactionId: Scalars['ID']['input'];
}>;


export type TransferTransactionMutation = { __typename?: 'Mutation', transferTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any } };

export type ReceiveTransactionMutationVariables = Exact<{
  transactionId: Scalars['ID']['input'];
}>;


export type ReceiveTransactionMutation = { __typename?: 'Mutation', receiveTransaction: { __typename?: 'Transaction', id: string, status: TransactionStatus, updatedAt: any } };

export type CreateItemMutationVariables = Exact<{
  name: Scalars['String']['input'];
  category: Array<Scalars['String']['input']> | Scalars['String']['input'];
  condition: ItemCondition;
  description?: InputMaybe<Scalars['String']['input']>;
  images?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  language: Language;
  publishedYear?: InputMaybe<Scalars['Int']['input']>;
  status: ItemStatus;
}>;


export type CreateItemMutation = { __typename?: 'Mutation', createItem: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string, updatedAt: any } };

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


export type CreateNewsPostMutation = { __typename?: 'Mutation', createNewsPost: { __typename?: 'NewsPost', content: string, createdAt: any, id: string, images?: Array<string> | null, isVisible: boolean, tags?: Array<string> | null, title: string, relatedItems?: Array<{ __typename?: 'Item', id: string, description?: string | null, name: string, ownerId: string }> | null } };

export type RecentAddedItemsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type RecentAddedItemsQuery = { __typename?: 'Query', recentAddedItems: Array<{ __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any }> };

export type NewsRecentPostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type NewsRecentPostsQuery = { __typename?: 'Query', newsRecentPosts: Array<{ __typename?: 'NewsPost', id: string, title: string, images?: Array<string> | null, createdAt: any, tags?: Array<string> | null }> };

export type UserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserQuery = { __typename?: 'Query', user?: { __typename?: 'User', createdAt: any, email: string, id: string, nickname?: string | null, address?: string | null, isVerified: boolean, isActive: boolean, role: Role, exchangePoints?: Array<string> | null, contactMethods?: Array<{ __typename?: 'ContactMethod', type: string, value: string, isPublic: boolean }> | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type ItemsByUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type ItemsByUserQuery = { __typename?: 'Query', itemsByUser: Array<{ __typename?: 'Item', id: string, name: string, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, category: Array<string>, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> };

export type GeocodeAddressQueryVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type GeocodeAddressQuery = { __typename?: 'Query', geocodeAddress?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null };

export type UpdateUserMutationVariables = Exact<{
  address?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
  exchangePoints?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, address?: string | null, nickname?: string | null, createdAt: any, isVerified: boolean, isActive: boolean, exchangePoints?: Array<string> | null, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null } };

export type GetExchangePointsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetExchangePointsQuery = { __typename?: 'Query', exchangePoints: Array<{ __typename?: 'User', id: string, nickname?: string | null, address?: string | null, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null }> };

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, email: string, address?: string | null, nickname?: string | null, createdAt: any, isVerified: boolean, isActive: boolean, location?: { __typename?: 'Location', latitude: number, longitude: number, geohash?: string | null } | null } };

export type RecentCategoriesQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
}>;


export type RecentCategoriesQuery = { __typename?: 'Query', recentUpdateCategories: Array<string> };

export type ItemsByLocationQueryVariables = Exact<{
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm: Scalars['Float']['input'];
  category?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type ItemsByLocationQuery = { __typename?: 'Query', itemsByLocation: Array<{ __typename?: 'Item', id: string, name: string, condition: ItemCondition, status: ItemStatus, images?: Array<string> | null, thumbnails?: Array<string> | null, category: Array<string>, location?: { __typename?: 'Location', latitude: number, longitude: number } | null }> };

export type HotCategoriesQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
}>;


export type HotCategoriesQuery = { __typename?: 'Query', hotCategories: Array<string> };

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
    nickname
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
export const UpdateItemDocument = gql`
    mutation UpdateItem($id: ID!, $name: String, $category: [String!], $condition: ItemCondition, $description: String, $images: [String!], $language: Language, $publishedYear: Int, $status: ItemStatus) {
  updateItem(
    id: $id
    name: $name
    category: $category
    condition: $condition
    description: $description
    images: $images
    language: $language
    publishedYear: $publishedYear
    status: $status
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
 *      condition: // value for 'condition'
 *      description: // value for 'description'
 *      images: // value for 'images'
 *      language: // value for 'language'
 *      publishedYear: // value for 'publishedYear'
 *      status: // value for 'status'
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
export const ItemDocument = gql`
    query Item($itemId: ID!) {
  item(id: $itemId) {
    id
    name
    description
    condition
    category
    status
    images
    thumbnails
    publishedYear
    language
    createdAt
    ownerId
    holderId
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
export const CreateTransactionDocument = gql`
    mutation CreateTransaction($itemId: ID!) {
  createTransaction(itemId: $itemId) {
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
    location {
      latitude
      longitude
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
export const ApproveTransactionDocument = gql`
    mutation ApproveTransaction($transactionId: ID!) {
  approveTransaction(id: $transactionId) {
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
 *      transactionId: // value for 'transactionId'
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
export const CancelTransactionDocument = gql`
    mutation CancelTransaction($transactionId: ID!) {
  cancelTransaction(id: $transactionId)
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
 *      transactionId: // value for 'transactionId'
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
export const TransferTransactionDocument = gql`
    mutation TransferTransaction($transactionId: ID!) {
  transferTransaction(id: $transactionId) {
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
 *      transactionId: // value for 'transactionId'
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
    mutation ReceiveTransaction($transactionId: ID!) {
  receiveTransaction(id: $transactionId) {
    id
    status
    updatedAt
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
 *      transactionId: // value for 'transactionId'
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
export const CreateItemDocument = gql`
    mutation CreateItem($name: String!, $category: [String!]!, $condition: ItemCondition!, $description: String, $images: [String!], $language: Language!, $publishedYear: Int, $status: ItemStatus!) {
  createItem(
    name: $name
    category: $category
    condition: $condition
    description: $description
    images: $images
    language: $language
    publishedYear: $publishedYear
    status: $status
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
    content
    createdAt
    id
    images
    isVisible
    relatedItems {
      id
      description
      name
      ownerId
    }
    tags
    title
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
    contactMethods {
      type
      value
      isPublic
    }
    location {
      latitude
      longitude
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
export const ItemsByUserDocument = gql`
    query ItemsByUser($userId: ID!, $limit: Int, $offset: Int) {
  itemsByUser(userId: $userId, limit: $limit, offset: $offset) {
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
export const UpdateUserDocument = gql`
    mutation UpdateUser($address: String, $nickname: String, $exchangePoints: [String!]) {
  updateUser(
    address: $address
    nickname: $nickname
    exchangePoints: $exchangePoints
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
    isVerified
    isActive
    exchangePoints
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
    mutation CreateUser($email: String!, $address: String, $nickname: String) {
  createUser(email: $email, address: $address, nickname: $nickname) {
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
export const ItemsByLocationDocument = gql`
    query ItemsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!, $category: [String!]) {
  itemsByLocation(
    latitude: $latitude
    longitude: $longitude
    radiusKm: $radiusKm
    category: $category
  ) {
    id
    name
    condition
    status
    location {
      latitude
      longitude
    }
    images
    thumbnails
    category
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
 *      category: // value for 'category'
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