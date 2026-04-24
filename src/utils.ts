import Papa from "papaparse";
import type { MovieProps } from "./types/MoviesProps";

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
