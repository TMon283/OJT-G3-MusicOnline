import { useState, useEffect } from "react";
import { musicApi, type FeaturedArtistResponse, type WeeklyTopItemResponse } from "../api/musicApi";
import { usePlayer } from "../components/GlobalPlayer";

export interface SearchResult {
  id: number;
  title: string;
  artist: string;
  duration: string;
  image: string;
  file_url?: string;
  album_id?: number;
}

export const useSearchAndTrending = () => {
  const { playTrack } = usePlayer();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [weeklyTopSongs, setWeeklyTopSongs] = useState<WeeklyTopItemResponse[]>([]);
  const [albumsRes, setAlbumsRes] = useState<any[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<FeaturedArtistResponse[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [artists, albums] = await Promise.all([
          musicApi.getFeaturedArtists(),
          musicApi.getAlbums(),
        ]);
        setFeaturedArtists(artists);
        setAlbumsRes(albums);
      } catch (error) {
        console.error("Failed to load search data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadTrendingSongs = async () => {
      try {
        const trending = await musicApi.getWeeklyTop("song");
        setWeeklyTopSongs(trending);
      } catch (error) {
        console.error("Failed to load trending songs:", error);
      }
    };
    loadTrendingSongs();
  }, []);

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    const allSongs: SearchResult[] = [];

    albumsRes.forEach((album) => {
      if (album.songs && Array.isArray(album.songs)) {
        const artistName =
          featuredArtists.find((a) => a.id === album.artist_id)?.name ||
          album.artist ||
          "Unknown Artist";

        album.songs.forEach((song: any) => {
          allSongs.push({
            id: song.id,
            title: song.title,
            artist: artistName,
            duration: song.duration || "0:00",
            image: song.cover_image || album.cover_image || "/images/albums/default.jpg",
            file_url: song.file_url,
            album_id: album.id,
          });
        });
      }
    });

    const filtered = allSongs.filter((song) => {
      const titleMatch = song.title.toLowerCase().includes(searchTerm);
      const artistMatch = song.artist.toLowerCase().includes(searchTerm);
      return titleMatch || artistMatch;
    });

    setSearchResults(filtered);
    setShowSearchDropdown(filtered.length > 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      performSearch(value);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(false);
    performSearch(searchQuery);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
      setShowSearchDropdown(false);
    }
  };

  const handlePlayFromSearch = (song: SearchResult, index: number) => {
    playTrack({
      id: song.id,
      title: song.title,
      artist: song.artist || "",
      duration: song.duration || "0:00",
      cover: song.image,
      file_url: song.file_url,
      album_id: song.album_id ?? null,
      views: 0,
      totalViews: 0,
      favoriteCount: 0,
      rank: index + 1,
    });
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  const handlePlayTrendingSong = (song: WeeklyTopItemResponse) => {
    playTrack({
      id: song.id,
      title: song.title ?? song.name ?? "",
      artist: song.artist || "",
      duration: song.duration || "0:00",
      cover: song.cover || "/images/albums/default.jpg",
      file_url: song.file_url,
      album_id: song.album_id ?? null,
      views: song.views ?? 0,
      totalViews: song.totalViews ?? 0,
      favoriteCount: song.favoriteCount ?? 0,
      rank: song.rank,
    });
  };

  return {
    searchQuery,
    searchResults,
    showSearchDropdown,
    isSearching,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setShowSearchDropdown,
    weeklyTopSongs,
    handleSearchChange,
    handleSearch,
    handleSearchKeyPress,
    handlePlayFromSearch,
    handlePlayTrendingSong,
    performSearch,
    handleSearchFocus: () => {
      if (searchResults.length > 0) {
        setShowSearchDropdown(true);
      }
    },
    handleSearchBlur: () => {
      setTimeout(() => setShowSearchDropdown(false), 200);
    },
  };
};

