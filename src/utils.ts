import Papa from "papaparse";
import { toast } from "react-toastify";
import * as tf from "@tensorflow/tfjs";

import type { MovieProps } from "./types/MoviesProps";
import type { RatingProps } from "./types/RatingProps";
import type { BuildMovieVectorsProps } from "./types/BuildMovieVectorsProps";
import type { RecommendedMovie } from "./types/RecommendedMovie";

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
  moviesListIds: MovieProps[],
  allRatings: RatingProps[],
) {
  const moviesRatings = allRatings.filter((rating) =>
    moviesListIds.some((movie) => movie.movieId === rating.movieId),
  );

  return moviesRatings;
}

export function buildMovieVectors(
  selectedMovies: MovieProps[],
  ratings: RatingProps[],
  allGenres: string[],
) {
  const vectorizedMovies = selectedMovies.map((movie) => {
    // 1. Calcula a média de notas deste filme específico
    const movieRatings = ratings.filter((r) => r.movieId === movie.movieId);
    // eslint-disable-next-line no-useless-assignment
    let averageRating = 3.0; // Nota neutra padrão caso ninguém tenha avaliado

    if (movieRatings.length > 0) {
      const sum = movieRatings.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = sum / movieRatings.length / 5; // Normaliza para 0-1 (considerando nota máxima 5)
    } else {
      averageRating = 0.6; // Nota neutra padrão caso ninguém tenha avaliado
    }

    // 2. Transforma os gêneros em 0s e 1s (One-Hot Encoding)
    const genresArray = movie.genres.split("|");
    const genreVector = allGenres.map((genre) =>
      genresArray.includes(genre) ? 1 : 0,
    );

    // 3. Monta o Array final do filme (20 posições de gêneros + 1 posição de nota)
    const rawVector = [...genreVector, averageRating];

    // 4. A Mágica do TF: Transforma o Array comum em um Tensor 1D
    const tensor = tf.tensor1d(rawVector);

    return {
      genres: movie.genres,
      movieId: movie.movieId,
      title: movie.title,
      tensor: tensor, // Aqui está o que o TensorFlow vai usar!
      rawVector: rawVector, // Guardamos o array puro caso precise debugar
    };
  });

  return vectorizedMovies;
}

export async function buildAllMoviesVectors(
  allMovies: MovieProps[],
  allRatings: RatingProps[],
  allGenres: string[],
): Promise<BuildMovieVectorsProps[]> {
  // Criamos a instância do Worker
  const worker = new Worker(new URL("./movie.worker.ts", import.meta.url), {
    type: "module",
  });

  // Enviamos os dados para o Worker começar a trabalhar
  worker.postMessage({
    allMovies: allMovies,
    allRatings: allRatings,
    allGenres: allGenres,
  });
  return new Promise((resolve) => {
    worker.onmessage = (e) => {
      const allMoviesVector = e.data; // Aqui está o resultado do cálculo

      worker.terminate(); // Importante: Mata o worker para não consumir memória

      resolve(allMoviesVector);
    };
  });
}

export function getTop10Recommendations(
  selectedMoviesVectors: BuildMovieVectorsProps[],
  allMoviesVectors: BuildMovieVectorsProps[],
): RecommendedMovie[] {
  return tf.tidy(() => {
    // 1. Criar o "Super Vetor" (Perfil do Usuário)
    const tensoresSelecionados = selectedMoviesVectors.map((m) => m.tensor);
    const perfilUsuario = tf.stack(tensoresSelecionados).mean(0) as tf.Tensor1D;

    // Normalizamos o usuário (preparação para a Similaridade de Cosseno)
    const userNormalized = perfilUsuario.div(tf.norm(perfilUsuario));

    // 2. A MÁGICA DA OTIMIZAÇÃO: Criar uma Matriz 2D com todos os filmes
    // Extraímos apenas os arrays de números puros
    const todosOsArrays = allMoviesVectors.map((m) => m.rawVector);

    // Transformamos em uma tabela gigante [9742 linhas, 21 colunas]
    const dbTensor = tf.tensor2d(todosOsArrays);

    // Normalizamos todos os filmes de uma só vez
    // O 'euclidean', 1, true garante que ele calcule a norma por linha (filme a filme)
    const dbNorms = tf.norm(dbTensor, "euclidean", 1, true);
    const dbNormalized = dbTensor.div(dbNorms);

    // 3. CALCULAR TUDO EM UM ÚNICO COMANDO
    // Multiplicação de matrizes: Compara o usuário com a base inteira em milissegundos
    const similaritiesTensor = tf.matMul(
      dbNormalized,
      userNormalized.expandDims(1),
    );

    // 4. BAIXAR OS DADOS (O dataSync é chamado UMA ÚNICA VEZ!)
    // Isso devolve um array gigante com as 9700 porcentagens
    const allScores = similaritiesTensor.dataSync();

    // 5. Remontar o objeto agora com as notas
    const recomendacoesComScore = allMoviesVectors.map((movie, index) => {
      let similarity = allScores[index];
      if (isNaN(similarity)) similarity = 0;

      return {
        movieId: movie.movieId,
        title: movie.title,
        genres: movie.genres,
        probability: Math.round(similarity * 100),
      };
    });

    // 6. Criar filtro rápido para ignorar o que ele já escolheu
    const idsSelecionados = new Set(
      selectedMoviesVectors.map((m) => m.movieId),
    );

    // 7. Filtrar, Ordenar e Cortar o Top 10
    const top10 = recomendacoesComScore
      .filter((movie) => !idsSelecionados.has(movie.movieId))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);

    return top10;
  });
}

export async function getRecommendations(
  selectedMoviesIds: MovieProps[],
  allMovies: MovieProps[],
  allRatings: RatingProps[],
): Promise<RecommendedMovie[]> {
  const allGenres = [
    ...new Set(allMovies.flatMap((movie) => movie.genres.split("|"))),
  ];

  const moviesRatings = await getRateMovies(selectedMoviesIds, allRatings);

  const moviesSelectedVector = buildMovieVectors(
    selectedMoviesIds,
    moviesRatings,
    allGenres,
  );
  const allMoviesVector = await buildAllMoviesVectors(
    allMovies,
    allRatings,
    allGenres,
  );

  const finalMovies = getTop10Recommendations(
    moviesSelectedVector,
    allMoviesVector,
  );

  console.log("✌️finalMovies --->", finalMovies);

  console.log("✌️allMoviesVector --->", allMoviesVector);
  console.log("✌️moviesSelectedVector --->", moviesSelectedVector);

  return finalMovies ?? []; // Retorna uma lista vazia por enquanto
}
