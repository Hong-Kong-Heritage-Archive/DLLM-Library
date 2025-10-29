import { gql } from "@apollo/client";

export const USER_DETAIL_QUERY = gql`
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

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser(
    $address: String
    $nickname: String
    $exchangePoints: [String!]
    $contactMethods: [ContactMethodInput!]
  ) {
    updateUser(
      address: $address
      nickname: $nickname
      exchangePoints: $exchangePoints
      contactMethods: $contactMethods
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
    }
  }
`;

export const GET_EXCHANGE_POINTS = gql`
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

export const CREATE_USER_MUTATION = gql`
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
