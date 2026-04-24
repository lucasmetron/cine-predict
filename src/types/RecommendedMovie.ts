export type RecommendedMovie = {
  movieId: number;
  title: string;
  genres: string;
  probability: number; // A nossa porcentagem de match!
};
