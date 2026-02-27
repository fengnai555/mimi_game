import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 定義資料庫檔案路徑
const dbPath = path.join(process.cwd(), 'leaderboard.json');

// 定義資料庫結構
interface LeaderboardEntry {
  name: string;
  score: number;
  timestamp: number;
}

// 預設假資料
const defaultData: LeaderboardEntry[] = [
  { name: '阿米大魔王', score: 99999, timestamp: Date.now() },
  { name: 'Kittymi', score: 88888, timestamp: Date.now() },
  { name: '消除大師', score: 77777, timestamp: Date.now() },
  { name: '咩咩', score: 66666, timestamp: Date.now() },
];

function readDB(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(dbPath)) {
      writeDB(defaultData);
      return defaultData;
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : defaultData;
  } catch (error) {
    console.error('Error reading DB:', error);
    return defaultData;
  }
}

function writeDB(data: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

export async function GET() {
  const data = readDB();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, score } = body;

    if (!name || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const currentData = readDB();
    currentData.push({ name, score, timestamp: Date.now() });
    
    // 重新排序並只保留前 10 名
    currentData.sort((a, b) => b.score - a.score);
    const top10 = currentData.slice(0, 10);
    
    writeDB(top10);
    return NextResponse.json(top10);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
