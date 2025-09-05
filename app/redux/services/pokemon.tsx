import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Define a service using a base URL and expected endpoints
export const pokemonApi = createApi({
  reducerPath: "pokemonApi",
  baseQuery: fetchBaseQuery({
    baseUrl:
      "https://e2-demo-field-eng.cloud.databricks.com/api/2.0/sql/statements",
    headers: {
      Authorization: "Bearer dapiec2b97816dbe739bb8990ce144fe79a4", //gitleaks:allow
      "Content-Type": "application/json",
    },
  }), //gitleaks:allow
  endpoints: (build) => ({
    getPokemonByName: build.query({
      query: (sql) => ({
        url: "/",
        method: "POST",
        body: {
          warehouse_id: "8baced1ff014912d",
          catalog: "odni",
          schema: "tagging",
          statement: "SELECT * from joined_data LIMIT 2000",
        },
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetPokemonByNameQuery } = pokemonApi;
