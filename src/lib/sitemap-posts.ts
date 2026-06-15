import { getApiBaseUrl } from "@/lib/api-base-url";

type SitemapPost = {
  _id: string;
  BumpTime?: string | Date;
  PostCreated?: string;
};

type PostsPageResponse = {
  posts?: SitemapPost[];
  hasMore?: boolean;
};

const PAGE_SIZE = 100;
const MAX_PAGES = 500;

export function getPostLastModified(post: SitemapPost): Date {
  if (post.BumpTime) {
    const bumped = new Date(post.BumpTime);
    if (!Number.isNaN(bumped.getTime())) {
      return bumped;
    }
  }

  if (post.PostCreated) {
    const created = new Date(post.PostCreated);
    if (!Number.isNaN(created.getTime())) {
      return created;
    }
  }

  return new Date();
}

export async function fetchApprovedPostsForSitemap(): Promise<SitemapPost[]> {
  const baseUrl = getApiBaseUrl();
  const posts: SitemapPost[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_PAGES) {
    const response = await fetch(
      `${baseUrl}/api/posts/get_all_posts?page=${page}&pageSize=${PAGE_SIZE}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      break;
    }

    const data = (await response.json()) as PostsPageResponse;
    const batch = Array.isArray(data.posts) ? data.posts : [];

    for (const post of batch) {
      if (post._id) {
        posts.push(post);
      }
    }

    hasMore = Boolean(data.hasMore) && batch.length > 0;
    page += 1;
  }

  return posts;
}
