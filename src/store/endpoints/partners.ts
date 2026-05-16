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

export const partnersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPartners: builder.query<{ message: string; allpartners: Partner[] }, void>({
      query: () => '/api/users/allpartners',
      providesTags: ['Partner'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPartnersQuery,
} = partnersApi;
