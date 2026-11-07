import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

export const EXCHANGE_POINT_NAME_QUERY = gql`
  query ExchangePointName($userId: ID!) {
    user(id: $userId) {
      id
      nickname
    }
  }
`;

const ExchangePointName: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useTranslation();
  const { data, loading, error } = useQuery<{
    user: { id: string; nickname?: string | null } | null;
  }>(EXCHANGE_POINT_NAME_QUERY, { variables: { userId } });

  if (loading) return <>{t("common.loading", "Loading...")}</>;
  if (error) {
    return <>{t("userProfile.exchangePointsError", "Error loading exchange points")}</>;
  }
  return <>{data?.user?.nickname || t("common.unknown", "Unknown")}</>;
};

const ExchangePointNames: React.FC<{ ids: readonly string[] }> = ({ ids }) => (
  <>
    {ids.map((id, index) => (
      <React.Fragment key={`${id}-${index}`}>
        {index > 0 && ", "}
        <ExchangePointName userId={id} />
      </React.Fragment>
    ))}
  </>
);

export default ExchangePointNames;
