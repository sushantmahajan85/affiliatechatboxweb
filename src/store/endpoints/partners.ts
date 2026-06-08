import { api } from "../api";

export interface Partner {
  _id: string;
  name: string;
  type: string;
  email: string;
  logo: string;
  description: string;
  link: string;
  btntext: string;
  createdAt: string;
  updatedAt: string;
}

export type PartnersFeedResponse = {
  message: string;
  allpartners: Partner[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export const partnersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPartners: builder.query<{ message: string; allpartners: Partner[] }, void>({
      query: () => '/api/users/allpartners',
      providesTags: ['Partner'],
    }),
    getPartnersFeed: builder.query<
      PartnersFeedResponse,
      { page: number; pageSize?: number; search?: string }
    >({
      query: ({ page, pageSize = 9, search = "" }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (search.trim()) params.set("search", search.trim());
        return `/api/users/allpartners?${params.toString()}`;
      },
      providesTags: ['Partner'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPartnersQuery,
  useGetPartnersFeedQuery,
} = partnersApi;
