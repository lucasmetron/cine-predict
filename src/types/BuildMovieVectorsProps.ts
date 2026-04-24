export interface BuildMovieVectorsProps {
  movieId: number;
  title: string;
  tensor: unknown; // O tipo exato do tensor depende da biblioteca que você está usando (ex: TensorFlow.js)
  rawVector: number[];
}
