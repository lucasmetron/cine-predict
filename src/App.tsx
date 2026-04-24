import React, { useEffect, useState } from "react";

import "./App.css";
import {
  genereteListMoviesToLearning,
  getRecommendations,
  handleToast,
  loadMovies,
  loadRatings,
} from "./utils";
import type { MovieProps } from "./types/MoviesProps";
import type { RatingProps } from "./types/RatingProps";

const App: React.FC = () => {
  const [allMoviesState, setAllMoviesState] = useState<MovieProps[]>([]);
  const [allRatingsState, setAllRatingsState] = useState<RatingProps[]>([]);
  const [moviesToLearning, setMoviesToLearning] = useState<MovieProps[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [recommendations, setRecommendations] = useState<MovieProps[]>([]);

  const toggleMovie = (id: number): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  async function loadList() {
    if (selectedIds.length === 0) {
      handleToast("Selecione pelo menos um filme", "error");
      return;
    }

    const recommendations = await getRecommendations(
      selectedIds,
      allMoviesState,
      allRatingsState,
    );
    setRecommendations(recommendations);
  }

  useEffect(() => {
    (async () => {
      const allMovies = await loadMovies();
      const allRatings = await loadRatings();
      setAllMoviesState(allMovies);
      setAllRatingsState(allRatings);
      setMoviesToLearning(genereteListMoviesToLearning(allMovies));
    })();
  }, []);

  return (
    <div className="container">
      <div className="logo-section">
        <div className="icon-stack">
          <div className="icon-react">⚛️</div>
          <div className="icon-tf">🧠</div>
        </div>
        <h1>CinePredict</h1>
        <p className="subtitle">Selecione filmes para treinar o modelo</p>
      </div>

      <div className="main-grid">
        <div className="card">
          <div className="card-header">
            <h3>Seus Gostos</h3>
            <span className="badge">{selectedIds.length} selecionados</span>
          </div>
          <div className="movie-list">
            {moviesToLearning.map((movie) => (
              <button
                key={movie.movieId}
                onClick={() => toggleMovie(movie.movieId)}
                className={`movie-item ${selectedIds.includes(movie.movieId) ? "active" : ""}`}
              >
                {movie.title}
              </button>
            ))}
          </div>

          <div className="btns">
            <button
              className="btn-predict"
              onClick={async () => {
                setMoviesToLearning(
                  genereteListMoviesToLearning(allMoviesState),
                );
                setSelectedIds([]);
              }}
            >
              Gerar outra lista de filmes
            </button>

            <button
              className="btn-predict"
              onClick={async () => {
                await loadList();
              }}
            >
              Gerar Predição
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Recomendações da IA</h3>
          <div className="recommendation-list">
            {recommendations.length > 0 ? (
              recommendations.map((res) => (
                <div key={res.movieId} className="res-item">
                  <div className="res-info">
                    <span className="res-title">{res.title}</span>
                    <span className="res-genres">
                      {res.genres.replace(/\|/g, ", ")}
                    </span>
                  </div>
                  <div className="res-badge">
                    {/* {(res.score * 100).toFixed(0)}% */}
                  </div>
                </div>
              ))
            ) : (
              <p className="placeholder">Aguardando dados...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
