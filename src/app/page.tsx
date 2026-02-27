'use client';

import { useState, useEffect } from 'react';
import { useGameLogic, GameMode } from '@/hooks/useGameLogic';
import Tile from '@/components/Tile';
import { COMBO_WINDOW } from '@/constants/gameConfig';

export default function Home() {
  const { 
    tiles, 
    collection,
    gameState, 
    score, 
    combo, 
    setGameState,
    initGame,
    gameMode,
    handleTileClick,
    returnTile 
  } = useGameLogic();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [username, setUsername] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<{name: string, score: number}[]>([]);

  useEffect(() => {
    setIsClient(true);
    
    const savedUser = localStorage.getItem('syy_username');
    if (savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
    }
  }, []);

  // 當遊戲結束且有分數時，儲存成績到後端（僅限無盡模式）
  useEffect(() => {
    if (gameMode === 'endless' && (gameState === 'win' || gameState === 'lose') && isLoggedIn && score > 0) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username, score: score }),
      }).catch(err => console.error('Failed to save score:', err));
    }
  }, [gameState, isLoggedIn, score, username, gameMode]);

  const handleOpenLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      } else {
        throw new Error('Failed to fetch API');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // 若後端讀取失敗，退回顯示假資料
      setLeaderboardData([
        { name: '連線失敗', score: 0 },
      ]);
    }
    setShowLeaderboard(true);
  };

  const handleLogin = () => {
    if (usernameInput.trim().length > 0) {
      const name = usernameInput.trim();
      localStorage.setItem('syy_username', name);
      setUsername(name);
      setIsLoggedIn(true);
    } else {
      alert("請輸入名號！");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('syy_username');
    setIsLoggedIn(false);
    setUsername('');
    setUsernameInput('');
    setGameState('menu');
  };

  return (
    // 外層為 viewport 大小，背景填滿
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: "url('/bg.png') no-repeat center center", backgroundSize: 'cover' }}>
      {/* 依據 globals.css 中的 @media 查詢自動切換電腦/手機佈局 */}
      <main className="game-container">
      {/* 登入註冊選單 */}
      {isClient && !isLoggedIn && (
        <div className="menu-overlay" style={{ zIndex: 3000 }}>
          <img src="/logo.png" alt="Logo" style={{ width: '180px', marginBottom: '20px', borderRadius: '15px' }} />
          <h1 style={{ color: '#4ecca3', fontSize: '2.5rem', marginBottom: '20px', textShadow: '0 0 20px rgba(78,204,163,0.5)' }}>請輸入名號</h1>
          <input 
            type="text" 
            placeholder="你是哪隻飯糰君？" 
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="login-input"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button className="menu-button" onClick={handleLogin}>進入</button>
        </div>
      )}

      {/* 啟動選單 */}
      {isClient && isLoggedIn && gameState === 'menu' && (
        <div className="menu-overlay">
          <img src="/logo.png" alt="Logo" style={{ width: '180px', marginBottom: '10px', borderRadius: '15px' }} />
          <h1 style={{ color: '#4ecca3', fontSize: '2.5rem', marginBottom: '5px', textShadow: '0 0 20px rgba(78,204,163,0.5)' }}>米米消消樂</h1>
          <p style={{ color: '#fff', marginBottom: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}>歡迎回來，{username} 小主！</p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="menu-button" style={{ width: '120px' }} onClick={() => initGame('normal')}>普通模式</button>
            <button className="menu-button" style={{ width: '120px' }} onClick={() => initGame('endless')}>無盡模式</button>
          </div>
          <button className="menu-button" style={{ background: '#ffcc00', color: '#333', marginTop: '10px' }} onClick={handleOpenLeaderboard}>🏆 排行榜 🏆</button>
          
          {/* 社群連結區域 */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', marginBottom: '10px' }}>
            <a href="https://www.twitch.tv/kittymi25" target="_blank" rel="noopener noreferrer" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/social/twitch.png" alt="Twitch" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
            </a>
            <a href="https://www.youtube.com/@a_mi_ovo" target="_blank" rel="noopener noreferrer" style={{ transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/social/youtube.png" alt="YouTube" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
            </a>
          </div>

          <button className="menu-button" onClick={handleLogout} style={{ background: 'rgba(255,100,100,0.2)', borderColor: 'rgba(255,100,100,0.5)', marginTop: '20px' }}>切換帳號</button>
        </div>
      )}

      {/* 排行榜覆蓋層 */}
      {isClient && showLeaderboard && (
        <div className="menu-overlay" style={{ zIndex: 3500 }}>
          <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '15px', width: '90%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
            <h2 style={{ color: '#4ecca3', textAlign: 'center', marginBottom: '20px', fontSize: '2rem' }}>🏆 英雄榜 🏆</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
              {Array.isArray(leaderboardData) && leaderboardData.map((player, index) => {
                // index 0 -> m6, index 1 -> m5, ... index 5 -> m1
                const rankImage = index < 6 ? `/leaderboard/m${6 - index}.png` : null;
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.1)', padding: '10px 15px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: index < 3 ? '#ffcc00' : '#fff' }}>
                        {rankImage ? <img src={rankImage} alt={`Top ${index + 1}`} style={{ height: '35px', objectFit: 'contain' }} /> : `#${index + 1}`}
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{player.name}</div>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: '#4ecca3', fontWeight: 'bold' }}>{player.score}</div>
                  </div>
                )
              })}
            </div>
            <button className="menu-button" style={{ width: '100%', marginTop: '20px', margin: '20px 0 0 0' }} onClick={() => setShowLeaderboard(false)}>關閉</button>
          </div>
        </div>
      )}


      <header style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'contain' }} />
          <div>
            <button 
              onClick={() => setGameState('menu')}
              style={{ background: 'none', border: 'none', color: '#4ecca3', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '4px' }}
            >
              ⬅ 返回選單
            </button>
            <h1 style={{ fontSize: '1.1rem', color: '#fff' }}>遊戲進行中</h1>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffcc00' }}>{score.toLocaleString()}</div>
          {combo > 1 && (
            <div style={{ fontSize: '0.8rem', color: '#ff6b6b', fontWeight: 'bold', animation: 'shake 0.5s infinite' }}>
              COMBO x{combo}!
            </div>
          )}
        </div>
      </header>

      <div className="game-board" style={{ 
        flex: 1, 
        position: 'relative', 
        overflow: 'hidden', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* 用容器比例來乘載磁磚，避免 px 強制寫死 */}
        <div style={{ 
          position: 'relative', 
          width: '90%', 
          maxWidth: '500px',
          aspectRatio: '1 / 1'
        }}>
          {tiles.map(tile => (
            !tile.isCollected && (
              <Tile 
                key={tile.id} 
                tile={tile} 
                onClick={handleTileClick} 
              />
            )
          ))}
        </div>
      </div>

      {/* 收集槽 - 點擊收集槽內的瓷磚可以放回去 */}
      <div className="collection-slot-wrapper" style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <div className="collection-slot" style={{ marginBottom: 0 }}>
          {collection.map((tile, index) => (
            <Tile 
              key={`${tile.id}-${index}`} 
              tile={tile} 
              onClick={() => {}} // 功能已註解：() => returnTile(tile)
              isStatic={true} 
            />
          ))}
          {Array.from({ length: 7 - collection.length }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="slot-placeholder"
            />
          ))}
        </div>
      </div>

      {/* 勝負彈窗 */}
      {(gameState === 'win' || gameState === 'lose') && (
        <div className="message-alert">
          <div style={{ fontSize: '2rem', marginBottom: '10px', color: gameState === 'win' ? '#4ecca3' : '#ff6b6b' }}>
            {gameState === 'win' ? '🎊 奇蹟！你贏了' : '💀 惜敗！'}
          </div>
          <div style={{ fontSize: '1.2rem', color: '#ffcc00', marginBottom: '30px' }}>
            最終得分: {score}
          </div>
          <button 
            onClick={() => setGameState('menu')}
            style={{
              padding: '12px 30px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            返回主選單
          </button>
        </div>
      )}
      
      <footer style={{ padding: '10px', textAlign: 'center', fontSize: '0.75rem', color: '#aaa', background: 'rgba(0,0,0,0.5)' }}>
        <p>點擊收集槽中的磁磚可將其放回場地</p>
        <p>連擊視窗：{COMBO_WINDOW / 1000}s</p>
      </footer>
      </main>
    </div>
  );
}
