import * as tf from "@tensorflow/tfjs";

export interface BuildMovieVectorsProps {
  movieId: number;
  title: string;
  genres: string;
  tensor: tf.Tensor1D;
  rawVector: number[];
}
