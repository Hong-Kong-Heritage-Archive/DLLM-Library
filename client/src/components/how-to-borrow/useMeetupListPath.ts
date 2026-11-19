import {
  NewsStatus,
  NewsRecentPostsQueryVariables,
  useNewsRecentPostsQuery,
} from "../../generated/graphql";

// Meetup booklists are titled with 「超強」 or 「超.強」.
// Phase 1 finds the list by title using the same status query as the
// 共同編輯文章 banner. Part 2 switches to the #超強推介 tag once admins
// have tagged the posts and the tag query is confirmed in production.
const MEETUP_TITLE = /超\.?強/;
const FALLBACK_PATH = "/news";

const variablesFor = (newsStatus: NewsStatus) =>
  ({
    tags: [],
    limit: 20,
    offset: 0,
    newsStatus,
  }) as NewsRecentPostsQueryVariables;

/**
 * Path to the latest 「超.強」推介 list: the newest open (co-editing) one,
 * else the newest published one, else the 新聞 tab.
 */
export const useMeetupListPath = (): string => {
  const open = useNewsRecentPostsQuery({
    variables: variablesFor(NewsStatus.CoEditing),
  });
  const openMatch = open.data?.newsRecentPosts.find((post) =>
    MEETUP_TITLE.test(post.title),
  );

  const published = useNewsRecentPostsQuery({
    variables: variablesFor(NewsStatus.Published),
    skip: open.loading || Boolean(openMatch),
  });
  const publishedMatch = published.data?.newsRecentPosts.find((post) =>
    MEETUP_TITLE.test(post.title),
  );

  const match = openMatch ?? publishedMatch;
  return match ? `/news/${match.id}` : FALLBACK_PATH;
};
