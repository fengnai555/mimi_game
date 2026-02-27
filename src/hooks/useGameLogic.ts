'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { TILE_TYPES, MAX_COLLECTION_SIZE, TILE_SIZE, BASE_SCORE, COMBO_WINDOW } from '../constants/gameConfig';

export interface TileData {
  id: string;
  type: string;
  x: number;
  y: number;
  z: number;
  isCollected: boolean;
  isHidden: boolean;
}

export type GameMode = 'normal' | 'endless';

export const useGameLogic = () => {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [collection, setCollection] = useState<TileData[]>([]);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'lose' | 'win'>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('normal');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const lastMatchTime = useRef<number>(0);
  const pendingClicks = useRef<Set<string>>(new Set());
  const maxZRef = useRef<number>(5); // 追蹤場面上最高的層級

  // 金字塔生成邏輯（通用於所有模式）
  const generatePyramidTiles = useCallback(() => {
    const newTiles: TileData[] = [];
    let pool: string[] = [];

    const layerConfigs = [
      { layer: 0, rows: 7, cols: 7 }, // 49
      { layer: 1, rows: 6, cols: 6 }, // 36
      { layer: 2, rows: 5, cols: 5 }, // 25
      { layer: 3, rows: 4, cols: 4 }, // 16
    ];
    
    // 總磁磚數：49+36+25+16 = 126 (剛好是 14 種 * 9 張)
    const targetCount = 126;
    const typesToUse = TILE_TYPES;
    const setsPerType = 3; // 14 種 * 3 組 * 3 張 = 126
    
    typesToUse.forEach(type => {
      for (let i = 0; i < setsPerType * 3; i++) pool.push(type);
    });

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    let poolIdx = 0;
    const centerX = 250;
    const centerY = 250;

    layerConfigs.forEach(config => {
      const spacingMultiplier = 0.6;
      const layerOffsetX = (config.cols * TILE_SIZE * spacingMultiplier) / 2;
      const layerOffsetY = (config.rows * TILE_SIZE * spacingMultiplier) / 2;
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (poolIdx >= pool.length) break;
          // 移除 random jitter 讓視覺整齊
          const x = centerX - layerOffsetX + (c * TILE_SIZE * spacingMultiplier);
          const y = centerY - layerOffsetY + (r * TILE_SIZE * spacingMultiplier);
          newTiles.push({
            id: `tile-${Date.now()}-${poolIdx}`,
            type: pool[poolIdx++],
            x, y, z: config.layer,
            isCollected: false,
            isHidden: false,
          });
        }
      }
    });

    // 不需要隨機保底邏輯，因為上方層級已完美分配 168 張
    return newTiles;
  }, []);

  // 初始化遊戲
  const initGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
    const newTiles = generatePyramidTiles();
    setTiles(newTiles);
    setCollection([]);
    setGameState('playing');
    setScore(0);
    setCombo(0);
  }, [generatePyramidTiles]);

  const checkCoverage = useCallback((currentTiles: TileData[]) => {
    return currentTiles.map(tile => {
      if (tile.isCollected) return tile;
      const isCovered = currentTiles.some(other => {
        if (other.isCollected || other.z <= tile.z || other.id === tile.id) return false;
        return Math.abs(tile.x - other.x) < TILE_SIZE * 0.85 && Math.abs(tile.y - other.y) < TILE_SIZE * 0.85;
      });
      return { ...tile, isHidden: isCovered };
    });
  }, []);

  useEffect(() => {
    if (tiles.length > 0) {
      const updated = checkCoverage(tiles);
      const hasChanged = updated.some((t, i) => t.isHidden !== tiles[i].isHidden);
      if (hasChanged) setTiles(updated);
    }
  }, [tiles, checkCoverage]);

  const updateScore = useCallback(() => {
    const now = Date.now();
    let newCombo = (now - lastMatchTime.current < COMBO_WINDOW) ? combo + 1 : 1;
    setScore(prev => prev + BASE_SCORE * newCombo);
    setCombo(newCombo);
    lastMatchTime.current = now;
  }, [combo]);

  const checkAndReplenish = useCallback(() => {
    if (gameMode !== 'endless' || gameState !== 'playing') return;
    
    setTiles(currentTiles => {
      const activeTiles = currentTiles.filter(t => !t.isCollected);
      // 當目前活躍方塊少於 15 個時補充
      if (activeTiles.length >= 15) return currentTiles;

      const typesToUse = TILE_TYPES;
      const newBatch: TileData[] = [];
      const pool: string[] = [];
      
      // 確保每一種花色都補進去 3 張（一組），保證完全平衡與擁有所有 14 種
      typesToUse.forEach(type => {
        pool.push(type, type, type);
      });

      // 更新最高層級，保證新牌在最上層
      maxZRef.current += 1;
      const newZ = maxZRef.current;

      pool.forEach((type, idx) => {
        newBatch.push({
          id: `rep-${Date.now()}-${idx}-${Math.random()}`,
          type,
          // 擴大隨機範圍：適配 500px 容器，扣掉方塊寬度後大約可用 0~400
          x: Math.random() * 380, 
          y: Math.random() * 380,
          z: newZ, 
          isCollected: false,
          isHidden: false,
        });
      });

      return [...currentTiles, ...newBatch];
    });
  }, [gameMode, gameState]);

  const handleTileClick = useCallback((clickedTile: TileData) => {
    if (clickedTile.isHidden || clickedTile.isCollected || gameState !== 'playing') return;
    
    // 刷分防禦：如果這張牌正在處理中，直接無視
    if (pendingClicks.current.has(clickedTile.id)) return;
    pendingClicks.current.add(clickedTile.id);

    setTiles(prev => prev.map(t => t.id === clickedTile.id ? { ...t, isCollected: true } : t));
    setCollection(prev => {
      const newCollection = [...prev, { ...clickedTile, isCollected: true }];
      newCollection.sort((a, b) => a.type.localeCompare(b.type));
      const counts: Record<string, number> = {};
      newCollection.forEach(t => counts[t.type] = (counts[t.type] || 0) + 1);
      const matchedType = Object.keys(counts).find(type => counts[type] === 3);
      if (matchedType) {
        updateScore();
        return newCollection.filter(t => t.type !== matchedType);
      }
      if (newCollection.length >= MAX_COLLECTION_SIZE) setGameState('lose');
      return newCollection;
    });
  }, [gameState, updateScore, checkAndReplenish]);

  /* 
  const returnTile = useCallback((returnedTile: TileData) => {
    if (gameState !== 'playing') return;
    setCollection(prev => prev.filter(t => t.id !== returnedTile.id));
    setTiles(prev => prev.map(t => t.id === returnedTile.id ? { ...t, isCollected: false } : t));
  }, [gameState]);
  */
  const returnTile = useCallback(() => {}, []);

  useEffect(() => {
    if (tiles.length > 0 && tiles.every(t => t.isCollected) && gameState === 'playing' && gameMode !== 'endless') {
      setGameState('win');
    }
    // 當方塊數量變動時檢查是否需要補牌 (無盡模式)
    if (gameMode === 'endless' && gameState === 'playing') {
      checkAndReplenish();
    }
  }, [tiles, gameState, gameMode, checkAndReplenish]);

  // 定期清理 pendingClicks 以免記憶體洩漏 (雖然 ID 是唯一的，但養成好習慣)
  useEffect(() => {
    if (gameState === 'playing') {
      const collectedIds = tiles.filter(t => t.isCollected).map(t => t.id);
      collectedIds.forEach(id => pendingClicks.current.delete(id));
    } else {
      pendingClicks.current.clear();
      maxZRef.current = 5;
    }
  }, [tiles, gameState]);

  return {
    tiles,
    collection,
    gameState,
    score,
    combo,
    setGameState,
    initGame,
    gameMode,
    handleTileClick,
    returnTile,
  };
};
