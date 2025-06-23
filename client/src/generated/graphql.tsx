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
  generateSignedUrl: SignedUrlResponse;
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


export type MutationGenerateSignedUrlArgs = {
  contentType: Scalars['String']['input'];
  fileName: Scalars['String']['input'];
  folder?: InputMaybe<Scalars['String']['input']>;
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
  category?: InputMaybe<Array<Scalars['String']['input']>>;
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

export type SignedUrlResponse = {
  __typename?: 'SignedUrlResponse';
  expires: Scalars['Float']['output'];
  gsUrl: Scalars['String']['output'];
  signedUrl: Scalars['String']['output'];
};

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

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', address?: string | null, createdAt: any, email: string, id: string, isVerified: boolean, isActive: boolean, role: Role, nickname?: string | null, location?: { __typename?: 'Location', latitude: number, longitude: number } | null } | null };

export type ItemQueryVariables = Exact<{
  itemId: Scalars['ID']['input'];
}>;


export type ItemQuery = { __typename?: 'Query', item?: { __typename?: 'Item', id: string, name: string, description?: string | null, condition: ItemCondition, category: Array<string>, status: ItemStatus, images?: Array<string> | null, publishedYear?: number | null, language: Language, createdAt: any, ownerId: string } | null };

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

export type CreateUserMutationVariables = Exact<{
  email: Scalars['String']['input'];
  address?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser: { __typename?: 'User', id: string, email: string, address?: string | null, nickname?: string | null, createdAt: any, isActive: boolean, isVerified: boolean, role: Role } };

export type ItemsByLocationQueryVariables = Exact<{
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  radiusKm: Scalars['Float']['input'];
}>;


export type ItemsByLocationQuery = { __typename?: 'Query', itemsByLocation: Array<{ __typename?: 'Item', id: string, name: string, condition: ItemCondition, status: ItemStatus, category: Array<string> }> };

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
    publishedYear
    language
    createdAt
    ownerId
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
export const CreateUserDocument = gql`
    mutation CreateUser($email: String!, $address: String, $nickname: String) {
  createUser(email: $email, address: $address, nickname: $nickname) {
    id
    email
    address
    nickname
    createdAt
    isActive
    isVerified
    role
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
export const ItemsByLocationDocument = gql`
    query ItemsByLocation($latitude: Float!, $longitude: Float!, $radiusKm: Float!) {
  itemsByLocation(latitude: $latitude, longitude: $longitude, radiusKm: $radiusKm) {
    id
    name
    condition
    status
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