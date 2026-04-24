import React, { useState } from "react";
import "./App.css";

// Definição dos gêneros baseada na documentação do MovieLens
const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Children",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Film-Noir",
  "Horror",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "War",
  "Western",
] as const;

interface Movie {
  movieId: number;
  title: string;
  genres: string;
}

interface RecommendedMovie extends Movie {
  score: number;
}

const ALL_MOVIES: Movie[] = [
  {
    movieId: 1,
    title: "Toy Story",
    genres: "Adventure|Animation|Children|Comedy|Fantasy",
  },
  { movieId: 2, title: "Jumanji", genres: "Adventure|Children|Fantasy" },
  { movieId: 3, title: "Grumpier Old Men", genres: "Comedy|Romance" },
  { movieId: 4, title: "Waiting to Exhale", genres: "Comedy|Drama|Romance" },
  { movieId: 5, title: "Heat", genres: "Action|Crime|Thriller" },
  { movieId: 32, title: "Twelve Monkeys", genres: "Mystery|Sci-Fi|Thriller" },
  { movieId: 47, title: "Seven", genres: "Mystery|Thriller" },
  {
    movieId: 50,
    title: "Usual Suspects, The",
    genres: "Crime|Mystery|Thriller",
  },
];

const App: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedMovie[]>(
    [],
  );

  const toggleMovie = (id: number): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
    setRecommendations([]);
    console.log("GENRES", GENRES);
  };

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
            {ALL_MOVIES.map((movie) => (
              <button
                key={movie.movieId}
                onClick={() => toggleMovie(movie.movieId)}
                className={`movie-item ${selectedIds.includes(movie.movieId) ? "active" : ""}`}
              >
                {movie.title}
              </button>
            ))}
          </div>
          <button className="btn-predict" onClick={() => {}}>
            Gerar Predição
          </button>
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
                    {(res.score * 100).toFixed(0)}%
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
