import { buildMovieVectors } from "./utils";

// movie.worker.ts
self.onmessage = (e) => {
  const { allMovies, allRatings, allGenres } = e.data; //recebe os dados
  const result = buildMovieVectors(allMovies, allRatings, allGenres); //processa os dados para criar os vetores de filmes
  self.postMessage(result); //envia os vetores de volta para o thread principal
};
