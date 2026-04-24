import Papa from "papaparse";
import { toast } from "react-toastify";

import type { MovieProps } from "./types/MoviesProps";
import type { RatingProps } from "./types/RatingProps";

export function handleToast(
  messsage: string,
  type: "success" | "error" | "info" | "warning",
): void {
  toast(messsage, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    type: type,
  });
}

export async function loadMovies(): Promise<MovieProps[]> {
  const response = await fetch("/data/movies.csv");
  const reader = response.body?.getReader();
  const result = await reader?.read();
  const decoder = new TextDecoder("utf-8");
  const csv = decoder.decode(result?.value);

  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as MovieProps[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

export async function loadRatings(): Promise<RatingProps[]> {
  const response = await fetch("/data/ratings.csv");
  const reader = response.body?.getReader();
  const result = await reader?.read();
  const decoder = new TextDecoder("utf-8");
  const csv = decoder.decode(result?.value);

  return new Promise((resolve, reject) => {
    Papa.parse(csv, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as RatingProps[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

export function genereteListMoviesToLearning(
  movies: MovieProps[],
  count: number = 20,
): MovieProps[] {
  const selectedMovies: MovieProps[] = [];
  const usedGenres = new Set<string>();

  // 1. Embaralhar a lista original para não pegar sempre os mesmos filmes (opcional)
  const shuffled = [...movies].sort(() => 0.5 - Math.random());

  // 2. Primeira passada: Tenta pegar um filme de um gênero que ainda não apareceu
  for (const movie of shuffled) {
    if (selectedMovies.length >= count) break;

    const movieGenres = movie.genres.split("|");
    // Verifica se esse filme tem algum gênero que ainda não "usamos" na nossa lista
    const hasNewGenre = movieGenres.some((genre) => !usedGenres.has(genre));

    if (hasNewGenre) {
      selectedMovies.push(movie);
      // Adiciona todos os gêneros desse filme ao Set de usados
      movieGenres.forEach((genre) => usedGenres.add(genre));
    }
  }

  // 3. Segunda passada: Se ainda não completou os 10 (caso a base seja pequena),
  // preenche com o que sobrar
  if (selectedMovies.length < count) {
    for (const movie of shuffled) {
      if (selectedMovies.length >= count) break;
      if (!selectedMovies.find((m) => m.movieId === movie.movieId)) {
        selectedMovies.push(movie);
      }
    }
  }

  return selectedMovies;
}

export async function getRateMovies(
  moviesListIds: number[],
  allRatings: RatingProps[],
) {
  const moviesRatings = allRatings.filter((rating) =>
    moviesListIds.includes(rating.movieId),
  );

  return moviesRatings;
}

export async function getRecommendations(
  selectedMoviesIds: number[],
  allMovies: MovieProps[],
  allRatings: RatingProps[],
): Promise<MovieProps[]> {
  const allGenres = [
    ...new Set(allMovies.flatMap((movie) => movie.genres.split("|"))),
  ];

  const moviesRatings = await getRateMovies(selectedMoviesIds, allRatings);

  console.log("✌️selectedMoviesIds --->", selectedMoviesIds);
  console.log("✌️moviesRatings --->", moviesRatings);
  console.log("✌️allGenres --->", allGenres);
  return []; // Retorna uma lista vazia por enquanto
}
