import { api } from "../api";

export const postsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAllPosts: builder.query<any, number>({
      query: (limit = 50) => `/api/posts/get_all_posts/${limit}`,
      providesTags: (result) => 
        result 
          ? [...result.posts.map(({ _id }: any) => ({ type: 'Post' as const, id: _id })), 'Post']
          : ['Post'],
    }),
    getAllPostsFeed: builder.query<
      { posts: any[]; hasMore: boolean; page: number; pageSize: number },
      { page: number; pageSize?: number }
    >({
      query: ({ page, pageSize = 10 }) =>
        `/api/posts/get_all_posts?page=${page}&pageSize=${pageSize}`,
      providesTags: (result) =>
        result
          ? [...result.posts.map(({ _id }: any) => ({ type: "Post" as const, id: _id })), "Post"]
          : ["Post"],
    }),
    getPostById: builder.query<any, string>({
      query: (postId) => `/api/posts/${postId}/get_post`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    getUserPosts: builder.query<any, string>({
      query: (userId) => `/api/posts/get_user_posts/${userId}`,
      providesTags: ['Post'],
    }),
    createPost: builder.mutation<any, { userId: string; data: FormData }>({
      query: ({ userId, data }) => ({
        url: `/api/posts/${userId}/posts/add_post`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Post'],
    }),
    searchPosts: builder.mutation<any, { searchQuery: string }>({
      query: (body) => ({
        url: '/api/posts/search',
        method: 'POST',
        body,
      }),
    }),
    bumpPost: builder.mutation<any, string>({
      query: (postId) => ({
        url: `/api/posts/${postId}/BumpPost`,
        method: 'POST',
      }),
      invalidatesTags: ['Post'],
    }),
    addPost: builder.mutation<any, { userId: string; formData: FormData }>({
      query: ({ userId, formData }) => ({
        url: `/api/posts/${userId}/posts/add_post`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Post"],
    }),
    getPinnedPosts: builder.query<any, void>({
      query: () => '/api/PinnedPosts/get_all_Pinned',
      providesTags: ['Post'],
    }),
    pinPost: builder.mutation<any, { postId: string; TotalPinned?: number }>({
      query: ({ postId, TotalPinned = 0 }) => ({
        url: `/api/PinnedPosts/${postId}/add_Pinned_post`,
        method: 'POST',
        body: { TotalPinned },
      }),
      invalidatesTags: ['Post'],
    }),
    unpinPost: builder.mutation<any, string>({
      query: (pinnedPostId) => ({
        url: `/api/PinnedPosts/${pinnedPostId}/delete_Pinned_Post`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Post'],
    }),
    editPost: builder.mutation<any, { postId: string; formData: FormData }>({
      query: ({ postId, formData }) => ({
        url: `/api/posts/${postId}/edit_post`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { postId }) => [{ type: "Post", id: postId }, "Post"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllPostsQuery,
  useGetAllPostsFeedQuery,
  useGetPostByIdQuery,
  useGetUserPostsQuery,
  useCreatePostMutation,
  useSearchPostsMutation,
  useBumpPostMutation,
  useAddPostMutation,
  useGetPinnedPostsQuery,
  usePinPostMutation,
  useUnpinPostMutation,
  useEditPostMutation,
} = postsApi;
