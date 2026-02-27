'use client';

import { TileData } from '../hooks/useGameLogic';

interface TileProps {
  tile: TileData;
  onClick: (tile: TileData) => void;
  isStatic?: boolean; // 如果在收集區，則不使用絕對定位
}

const Tile: React.FC<TileProps> = ({ tile, onClick, isStatic = false }) => {
  const style: React.CSSProperties = isStatic 
    ? { 
        position: 'relative', 
        flexShrink: 0 
      } 
    : {
        // 利用原始容器 500px 來換算相對比例百分比 (%)
        left: `${(tile.x / 500) * 100}%`,
        top: `${(tile.y / 500) * 100}%`,
        width: '24%', // 原始 120px / 500px 剛好 24%
        height: '24%',
        zIndex: tile.z + 10,
      };

  return (
    <div
      className={`tile-base ${tile.isHidden ? 'tile-hidden' : ''}`}
      style={style}
      onClick={() => onClick(tile)}
    >
      {/* 判斷如果是圖片路徑則渲染 img，否則渲染 Emoji */}
      {tile.type.startsWith('/') ? (
        <img 
          src={tile.type} 
          alt="tile" 
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block', // 確保沒有 inline 間隙
            pointerEvents: 'none',
            objectFit: 'fill' // 使用 fill 強制填滿 Div
          }} 
        />
      ) : (
        tile.type
      )}
    </div>
  );
};

export default Tile;
