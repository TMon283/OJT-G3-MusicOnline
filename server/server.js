const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Helper: Lấy danh sách tất cả albums (từ bảng albums gốc + albums của từng artist trong users)
const getAllAlbums = (db) => {
  const users = db.get('users').value() || [];
  const rootAlbums = db.get('albums').value() || [];

  const albums = [...rootAlbums];

  users.forEach((user) => {
    if (Array.isArray(user.albums)) {
      user.albums.forEach((album) => {
        if (!album) return;
        albums.push({
          ...album,
          // đảm bảo có artist_id để Dashboard/weekly_top dùng
          artist_id: album.artist_id || album.artistId || user.id,
        });
      });
    }
  });

  return albums;
};

// Custom routes để xử lý các endpoint đặc biệt
server.get('/featured_artists', (req, res) => {
  const db = router.db;
  
  // Lấy tất cả users có role ARTIST và tính tổng lượt xem của album
  const users = db.get('users').value() || [];
  const albums = getAllAlbums(db);
  
  const artistsWithViews = users
    .filter(user => user.role === 'ROLE_ARTIST')
    .map(user => {
      // Tính tổng views của tất cả album của artist này
      let totalViews = 0;
      const userAlbums = user.albums || [];
      
      userAlbums.forEach(album => {
        if (album.songs && Array.isArray(album.songs)) {
          const albumViews = album.songs.reduce((sum, song) => sum + (song.views || 0), 0);
          totalViews += albumViews;
        }
      });
      
      // Kiểm tra albums gốc nếu có
      albums.forEach(album => {
        if (album.artist_id === user.id && album.songs && Array.isArray(album.songs)) {
          const albumViews = album.songs.reduce((sum, song) => sum + (song.views || 0), 0);
          totalViews += albumViews;
        }
      });
      
      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        image: user.profile_image || '/images/users/default.jpg',
        totalViews: totalViews,
        followerCount: Math.floor(Math.random() * 10000) + 1000,
        topTrack: 'Popular Track'
      };
    });
  
  // Sắp xếp theo totalViews giảm dần
  const sortedArtists = artistsWithViews.sort((a, b) => b.totalViews - a.totalViews);
  
  res.json(sortedArtists);
});

server.get('/featured_genres', (req, res) => {
  const db = router.db;
  
  const genres = db.get('genres').value().map(genre => ({
    id: genre.id,
    name: genre.genre_name,
    coverImage: `https://images.unsplash.com/photo-${1500000000000 + genre.id}?w=400&h=400&fit=crop`
  }));
  
  res.json(genres);
});

server.get('/banners', (req, res) => {
  const db = router.db;

  // Trả đúng cấu trúc như trong db.json: { id, url, position }
  // để cả trang Dashboard (musicApi.getBanners) và trang Admin Banner_manager dùng chung.
  const banners = db.get('banenrs').value() || [];

  res.json(banners);
});

server.get('/albums', (req, res) => {
  const db = router.db;
  const albums = getAllAlbums(db);
  res.json(albums);
});

server.get('/weekly_top', (req, res) => {
  const db = router.db;
  const type = req.query.type || 'song';
  
  if (type === 'song') {
    // Lấy tất cả songs từ tất cả albums
    const allSongs = [];
    const albums = getAllAlbums(db);
    const users = db.get('users').value() || [];
    
    albums.forEach(album => {
      if (album.songs && Array.isArray(album.songs)) {
        album.songs.forEach(song => {
          allSongs.push({
            ...song,
            album_id: album.id,
            artist_id: album.artist_id
          });
        });
      }
    });
    
    // Tính số lượt yêu thích (favoriteCount) cho từng bài hát
    const getFavoriteCount = (songId) => {
      return users.reduce((count, user) => {
        if (Array.isArray(user.favorites) && user.favorites.includes(songId)) {
          return count + 1;
        }
        return count;
      }, 0);
    };

    // Sắp xếp theo views (ưu tiên) và lượt yêu thích, lấy top 15
    const topSongs = allSongs
      .map(song => ({
        ...song,
        views: song.views || 0,
        favoriteCount: getFavoriteCount(song.id)
      }))
      .sort((a, b) => {
        // sort theo views trước, nếu bằng nhau thì theo favoriteCount
        if ((b.views || 0) !== (a.views || 0)) {
          return (b.views || 0) - (a.views || 0);
        }
        return (b.favoriteCount || 0) - (a.favoriteCount || 0);
      })
      .slice(0, 15);
    
    // Lấy thông tin album và artist cho mỗi bài hát
    const result = topSongs.map((song, index) => {
      // Tìm album trong toàn bộ danh sách albums (bao gồm albums của artist trong users)
      const album = albums.find(a => a.id === song.album_id);
      const artist = album
        ? db.get('users').find({ id: album.artist_id }).value()
        : null;

      // Ưu tiên tên nghệ sĩ từ bảng users, nếu không có thì fallback sang trường artist của album
      const artistName = artist
        ? `${artist.first_name ?? ''} ${artist.last_name ?? ''}`.trim()
        : album?.artist || 'Unknown Artist';

      return {
        id: song.id,
        album_id: album ? album.id : null,
        title: song.title,
        artist: artistName,
        duration: song.duration,
        // Ưu tiên song.cover_image, sau đó album.cover_image
        cover: song.cover_image || album?.cover_image || '/images/albums/default.jpg',
        file_url: song.file_url || null,
        views: song.views || 0,
        favoriteCount: song.favoriteCount || 0,
        rank: index + 1
      };
    });
    
    res.json(result);
  } else if (type === 'album') {
    // Lấy top albums dựa trên tổng views + lượt yêu thích của các bài trong album
    const albums = getAllAlbums(db);
    const users = db.get('users').value() || [];

    const getSongFavoriteCount = (songId) => {
      return users.reduce((count, user) => {
        if (Array.isArray(user.favorites) && user.favorites.includes(songId)) {
          return count + 1;
        }
        return count;
      }, 0);
    };

    const enrichedAlbums = albums.map(album => {
      const songs = album.songs || [];
      const totalViews = songs.reduce((sum, song) => sum + (song.views || 0), 0);
      const favoriteCount = songs.reduce(
        (sum, song) => sum + getSongFavoriteCount(song.id),
        0
      );
      return {
        ...album,
        totalViews,
        favoriteCount
      };
    });

    const topAlbums = enrichedAlbums
      .sort((a, b) => {
        if ((b.totalViews || 0) !== (a.totalViews || 0)) {
          return (b.totalViews || 0) - (a.totalViews || 0);
        }
        return (b.favoriteCount || 0) - (a.favoriteCount || 0);
      })
      .slice(0, 15);
    
    const result = topAlbums.map((album, index) => {
      const artist = db.get('users').find({ id: album.artist_id }).value();
      
      return {
        id: album.id,
        name: album.title,
        artist: artist ? `${artist.first_name} ${artist.last_name}` : 'Unknown Artist',
        cover: album.cover_image || '/images/albums/default.jpg',
        totalViews: album.totalViews || 0,
        favoriteCount: album.favoriteCount || 0,
        rank: index + 1
      };
    });
    
    res.json(result);
  } else {
    res.json([]);
  }
});

server.get('/recently_played', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.query.userId) || null;
  
  let historyIds = [];
  
  if (userId) {
    // Đã đăng nhập - lấy từ user
    const user = db.get('users').find({ id: userId }).value();
    if (user && user.history && user.history.length > 0) {
      historyIds = user.history;
    }
  } else {
    // Chưa đăng nhập - trả về empty (sẽ lấy từ localStorage ở client)
    return res.json([]);
  }
  
  if (historyIds.length === 0) {
    return res.json([]);
  }
  
  // Lấy tất cả albums để tìm songs
  const albums = getAllAlbums(db);
  const allSongs = [];
  albums.forEach(album => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach(song => {
        allSongs.push({
          ...song,
          album_id: album.id,
          artist_id: album.artist_id
        });
      });
    }
  });
  
  // Lấy songs từ history (history chứa song_ids), sắp xếp từ mới nhất đến cũ nhất
  const result = historyIds
    .slice(0, 10) // Lấy 10 bài gần nhất
    .map(songId => {
      const song = allSongs.find(s => s.id === songId);
      if (!song) return null;
      
      const album = albums.find(a => a.id === song.album_id);
      const artist = album ? db.get('users').find({ id: album.artist_id }).value() : null;
      
      return {
        id: song.id,
        title: song.title,
        artist: artist ? `${artist.first_name} ${artist.last_name}` : 'Unknown Artist',
        // Ưu tiên song.cover_image, sau đó album.cover_image
        cover: song.cover_image || album?.cover_image || '/images/albums/default.jpg',
        playedAt: new Date().toISOString()
      };
    })
    .filter(Boolean);
  
  res.json(result);
});

server.get('/downloads', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.query.userId) || 1;
  
  // Lấy user và downloads từ user
  const user = db.get('users').find({ id: userId }).value();
  if (!user || !user.downloads || user.downloads.length === 0) {
    return res.json([]);
  }
  
  // Lấy tất cả albums để tìm songs
  const albums = getAllAlbums(db);
  const allSongs = [];
  albums.forEach(album => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach(song => {
        allSongs.push({
          ...song,
          album_id: album.id,
          artist_id: album.artist_id
        });
      });
    }
  });
  
  // Lấy songs từ downloads (downloads chứa song_ids)
  const result = user.downloads.map(songId => {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return null;
    
    const album = albums.find(a => a.id === song.album_id);
    
    return {
      id: songId,
      userId: userId,
      title: song.title,
      album: album?.title,
      duration: song.duration,
      cover: album?.cover_image || '/images/albums/default.jpg',
      file_url: song.file_url,
      favorite: user.favorites && user.favorites.includes(songId)
    };
  }).filter(Boolean);
  
  res.json(result);
});

server.post('/downloads', (req, res) => {
  const db = router.db;
  const userId = req.body.userId;
  const user = db.get('users').find({ id: userId }).value();
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Tìm song_id từ title trong tất cả albums
  let songId = null;
  const albums = getAllAlbums(db);
  for (const album of albums) {
    if (album.songs && Array.isArray(album.songs)) {
      const song = album.songs.find(s => s.title === req.body.title);
      if (song) {
        songId = song.id;
        break;
      }
    }
  }
  
  if (!songId) {
    return res.status(404).json({ error: 'Song not found' });
  }
  
  // Kiểm tra xem đã có trong downloads chưa
  const downloads = user.downloads || [];
  if (downloads.includes(songId)) {
    // Đã có rồi, trả về dữ liệu hiện tại
    const song = albums.flatMap(a => a.songs || []).find(s => s.id === songId);
    const album = albums.find(a => a.songs && a.songs.some(s => s.id === songId));
    
    return res.json({
      id: songId,
      userId: userId,
      title: song?.title || req.body.title,
      album: album?.title || req.body.album,
      duration: song?.duration || req.body.duration,
      cover: album?.cover_image || req.body.cover || '/images/albums/default.jpg',
      file_url: song?.file_url || req.body.file_url,
      favorite: user.favorites && user.favorites.includes(songId)
    });
  }
  
  // Thêm vào downloads của user
  downloads.push(songId);
  db.get('users')
    .find({ id: userId })
    .assign({ downloads: downloads })
    .write();
  
  const song = albums.flatMap(a => a.songs || []).find(s => s.id === songId);
  const album = albums.find(a => a.songs && a.songs.some(s => s.id === songId));
  
  res.json({
    id: songId,
    userId: userId,
    title: song?.title || req.body.title,
    album: album?.title || req.body.album,
    duration: song?.duration || req.body.duration,
    cover: album?.cover_image || req.body.cover || '/images/albums/default.jpg',
    file_url: song?.file_url || req.body.file_url,
    favorite: user.favorites && user.favorites.includes(songId)
  });
});

server.delete('/downloads/:id', (req, res) => {
  const db = router.db;
  const songId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId) || 1;
  
  const user = db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const downloads = (user.downloads || []).filter(id => id !== songId);
  db.get('users')
    .find({ id: userId })
    .assign({ downloads: downloads })
    .write();
  
  res.status(204).send();
});

server.patch('/downloads/:id', (req, res) => {
  const db = router.db;
  const songId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId) || 1;
  const download = db.get('downloads').find({ user_id: userId, song_id: songId }).value();
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }
  
  // Cập nhật favorite (có thể mở rộng thêm các field khác)
  const song = db.get('songs').find({ id: songId }).value();
  const album = song ? db.get('albums').find({ id: song.album_id }).value() : null;
  
  res.json({
    id: songId,
    userId: userId,
    title: song?.title || '',
    album: album?.title,
    duration: song?.duration,
    cover: album?.cover_image || '/images/albums/default.jpg',
    file_url: song?.file_url,
    favorite: req.body.favorite !== undefined ? req.body.favorite : false
  });
});

server.get('/favorites', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.query.userId) || 1;
  
  // Lấy user và favorites từ user
  const user = db.get('users').find({ id: userId }).value();
  if (!user || !user.favorites || user.favorites.length === 0) {
    return res.json([]);
  }
  
  // Lấy tất cả albums để tìm songs
  const albums = getAllAlbums(db);
  const allSongs = [];
  albums.forEach(album => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach(song => {
        allSongs.push({
          ...song,
          album_id: album.id,
          artist_id: album.artist_id
        });
      });
    }
  });
  
  // Lấy songs từ favorites (favorites chứa song_ids)
  const result = user.favorites.map(songId => {
      const song = allSongs.find(s => s.id === songId);
    if (!song) return null;
    
      const album = albums.find(a => a.id === song.album_id);
    
    return {
      id: songId,
      userId: userId,
      title: song.title,
      album: album?.title,
      duration: song.duration,
      cover: album?.cover_image || '/images/albums/default.jpg',
      file_url: song.file_url,
      addedAt: new Date().toISOString()
    };
  }).filter(Boolean);
  
  res.json(result);
});

// Thêm bài hát vào danh sách yêu thích của user
server.post('/favorites', (req, res) => {
  const db = router.db;
  const userId = req.body.userId ? parseInt(req.body.userId) : 1;
  const songId = parseInt(req.body.songId);

  if (!songId) {
    return res.status(400).json({ error: 'songId is required' });
  }

  const user = db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const favorites = user.favorites || [];
  if (!favorites.includes(songId)) {
    favorites.push(songId);
    db.get('users')
      .find({ id: userId })
      .assign({ favorites })
      .write();
  }

  // Trả lại chi tiết bài hát giống GET /favorites
  const albums = getAllAlbums(db);
  const allSongs = [];
  albums.forEach(album => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach(song => {
        allSongs.push({
          ...song,
          album_id: album.id,
          artist_id: album.artist_id
        });
      });
    }
  });

  const song = allSongs.find(s => s.id === songId);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const album = albums.find(a => a.id === song.album_id);

  res.json({
    id: songId,
    userId: userId,
    title: song.title,
    album: album?.title,
    duration: song.duration,
    cover: album?.cover_image || '/images/albums/default.jpg',
    file_url: song.file_url,
    addedAt: new Date().toISOString()
  });
});

server.delete('/favorites/:id', (req, res) => {
  const db = router.db;
  const songId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId) || 1;
  
  const user = db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const favorites = (user.favorites || []).filter(id => id !== songId);
  db.get('users')
    .find({ id: userId })
    .assign({ favorites: favorites })
    .write();
  
  res.status(204).send();
});

server.get('/history', (req, res) => {
  const db = router.db;
  const userId = parseInt(req.query.userId) || 1;
  
  // Lấy user và history từ user
  const user = db.get('users').find({ id: userId }).value();
  if (!user || !user.history || user.history.length === 0) {
    return res.json([]);
  }
  
  // Lấy tất cả albums để tìm songs
  const albums = getAllAlbums(db);
  const allSongs = [];
  albums.forEach(album => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach(song => {
        allSongs.push({
          ...song,
          album_id: album.id,
          artist_id: album.artist_id,
          album_title: album.title,
          album_cover: album.cover_image
        });
      });
    }
  });
  
  // Map từ history entries ({user_id, song_id, played_at}) sang full song info
  const result = user.history
    .map((entry) => {
      // entry có thể là object {user_id, song_id, played_at} hoặc số (backward compatibility)
      const songId = typeof entry === 'object' ? entry.song_id : entry;
      const playedAt = typeof entry === 'object' ? entry.played_at : new Date().toISOString();
      
      const song = allSongs.find(s => s.id === songId);
      if (!song) return null;
      
      // Tìm artist từ album
      const artistUser = song.artist_id 
        ? db.get('users').find({ id: song.artist_id }).value()
        : null;
      const artistName = artistUser
        ? `${artistUser.first_name ?? ""} ${artistUser.last_name ?? ""}`.trim() || artistUser.email
        : "Unknown Artist";
      
      return {
        id: songId,
        userId: userId,
        title: song.title,
        artist: artistName,
        album: song.album_title || null,
        duration: song.duration || null,
        cover: song.album_cover || '/images/albums/default.jpg',
        file_url: song.file_url || null,
        playedAt: playedAt
      };
    })
    .filter(Boolean);
  
  // Sắp xếp theo played_at giảm dần (mới nhất lên trước)
  result.sort((a, b) => 
    new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );
  
  res.json(result);
});

// Tăng view cho bài hát và cập nhật tổng view album
server.post('/songs/:id/view', (req, res) => {
  const db = router.db;
  const songId = parseInt(req.params.id);
  const albumId = req.body && req.body.album_id ? parseInt(req.body.album_id) : null;

  let songFound = false;

  const recalcAlbumViews = (album) => {
    if (!album || !Array.isArray(album.songs)) return;
    album.totalViews = album.songs.reduce(
      (sum, s) => sum + (s.views || 0),
      0
    );
  };

  // Cập nhật trong bảng albums gốc (nếu có)
  const rootAlbums = db.get('albums').value() || [];
  rootAlbums.forEach((album) => {
    if (!album || !Array.isArray(album.songs)) return;
    if (albumId && album.id !== albumId) return;

    let foundInThisAlbum = false;
    album.songs.forEach((song) => {
      if (song.id === songId) {
        song.views = (song.views || 0) + 1;
        songFound = true;
        foundInThisAlbum = true;
      }
    });

    if (foundInThisAlbum) {
      recalcAlbumViews(album);
    }
  });
  if (rootAlbums.length > 0) {
    db.set('albums', rootAlbums).write();
  }

  // Cập nhật trong albums của từng user (artist)
  const users = db.get('users').value() || [];
  users.forEach((user) => {
    if (!Array.isArray(user.albums)) return;
    user.albums.forEach((album) => {
      if (!album || !Array.isArray(album.songs)) return;
      if (albumId && album.id !== albumId) return;

      let foundInThisAlbum = false;
      album.songs.forEach((song) => {
        if (song.id === songId) {
          song.views = (song.views || 0) + 1;
          songFound = true;
          foundInThisAlbum = true;
        }
      });

      if (foundInThisAlbum) {
        recalcAlbumViews(album);
      }
    });
  });
  if (users.length > 0) {
    db.set('users', users).write();
  }

  if (!songFound) {
    return res.status(404).json({ error: 'Song not found' });
  }

  res.json({ success: true });
});

server.post('/history', (req, res) => {
  const db = router.db;
  const { userId, songId: rawSongId } = req.body;

  const user = db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const songId = parseInt(rawSongId, 10);
  if (!songId || Number.isNaN(songId)) {
    return res.status(400).json({ error: 'Invalid songId' });
  }

  // Kiểm tra song có tồn tại không
  const albums = getAllAlbums(db);
  const songExists = albums.some(
    (a) => a.songs && Array.isArray(a.songs) && a.songs.some((s) => s.id === songId)
  );

  if (!songExists) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Lấy history của user (chỉ chứa {user_id, song_id, played_at})
  const history = user.history || [];

  // Xóa bản ghi cũ nếu trùng song_id
  const filteredHistory = history.filter((h) => h.song_id !== songId);

  // Thêm bản ghi mới vào đầu (mới nhất lên trước)
  const newEntry = {
    user_id: userId,
    song_id: songId,
    played_at: new Date().toISOString(),
  };

  filteredHistory.unshift(newEntry);

  // Giới hạn 100 bản ghi
  const limitedHistory = filteredHistory.slice(0, 100);

  db.get('users')
    .find({ id: userId })
    .assign({ history: limitedHistory })
    .write();

  res.json(newEntry);
});

server.delete('/history/:id', (req, res) => {
  const db = router.db;
  const songId = parseInt(req.params.id);
  const userId = parseInt(req.query.userId) || 1;
  
  const user = db.get('users').find({ id: userId }).value();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Xóa entry có song_id trùng với id trong params
  const history = (user.history || []).filter(entry => {
    const entrySongId = typeof entry === 'object' ? entry.song_id : entry;
    return entrySongId !== songId;
  });
  
  db.get('users')
    .find({ id: userId })
    .assign({ history: history })
    .write();
  
  res.status(204).send();
});

// Middleware để tự động tăng id album, song id từ 1 khi artist thêm album / bài hát
server.use((req, res, next) => {
  // Chỉ xử lý PATCH request đến /users/:id với albums
  if (req.method === 'PATCH' && req.path.match(/^\/users\/\d+$/) && req.body && req.body.albums) {
    const db = router.db;
    const albums = req.body.albums;

    const allUsers = db.get('users').value() || [];
    const rootAlbums = db.get('albums').value() || [];

    // === ALBUM ID ===
    // Thu thập tất cả album hiện có trong DB
    const existingAlbumIds = new Set();
    let maxAlbumId = 0;

    const collectAlbum = (album) => {
      if (!album || typeof album !== 'object') return;
      if (typeof album.id === 'number' && album.id > 0) {
        existingAlbumIds.add(album.id);
        if (album.id > maxAlbumId) maxAlbumId = album.id;
      }
    };

    allUsers.forEach(user => {
      if (Array.isArray(user.albums)) {
        user.albums.forEach(collectAlbum);
      }
    });
    if (Array.isArray(rootAlbums)) {
      rootAlbums.forEach(collectAlbum);
    }

    // === SONG ID ===
    const existingSongIds = new Set();
    let maxSongId = 0;

    const collectSongs = (album) => {
      if (!album || !Array.isArray(album.songs)) return;
      album.songs.forEach(song => {
        if (song && typeof song.id === 'number' && song.id > 0) {
          existingSongIds.add(song.id);
          if (song.id > maxSongId) maxSongId = song.id;
        }
      });
    };

    allUsers.forEach(user => {
      if (Array.isArray(user.albums)) {
        user.albums.forEach(collectSongs);
      }
    });
    if (Array.isArray(rootAlbums)) {
      rootAlbums.forEach(collectSongs);
    }

    // Gán id cho album mới & song mới
    albums.forEach((album) => {
      // Album mới nếu: không có id hợp lệ HOẶC id chưa tồn tại trong DB
      if (
        !album.id ||
        typeof album.id !== 'number' ||
        album.id <= 0 ||
        !existingAlbumIds.has(album.id)
      ) {
        maxAlbumId += 1;
        album.id = maxAlbumId;
        existingAlbumIds.add(album.id);
      }

      // Xử lý song id trong từng album
      if (Array.isArray(album.songs)) {
        album.songs.forEach(song => {
          if (
            !song.id ||
            typeof song.id !== 'number' ||
            song.id <= 0 ||
            !existingSongIds.has(song.id)
          ) {
            maxSongId += 1;
            song.id = maxSongId;
            existingSongIds.add(song.id);
          }
        });
      }
    });
  }
  
  next();
});

// Sử dụng json-server router cho các endpoint khác
server.use(router);

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

