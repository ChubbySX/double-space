#!/usr/bin/env node
/*
 * build.js — 情侣空间网站构建脚本（零依赖）
 * 扫描 content/ → 生成 data.json + js/data.js（内嵌 window.SITE_DATA，支持 file:// 打开）
 * 用法: node build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const OUT_JSON = path.join(ROOT, 'data.json');
const OUT_JS = path.join(ROOT, 'js', 'data.js');

/* ---------- 通用工具 ---------- */

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('  ⚠ 无法读取 ' + p + ': ' + e.message);
    return null;
  }
}

function writeFile(p, content) {
  fs.writeFileSync(p, content, 'utf8');
  console.log('  ✔ ' + path.relative(ROOT, p));
}

/** 递归剥离所有 _ 开头的键（_说明 注释约定） */
function stripUnderscore(obj) {
  if (Array.isArray(obj)) return obj.map(stripUnderscore);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) {
      if (k.startsWith('_')) continue;
      out[k] = stripUnderscore(obj[k]);
    }
    return out;
  }
  return obj;
}

/* ---------- 版本号 ---------- */
function readVersion() {
  const v = readJSON(path.join(CONTENT, 'version.json'));
  return v && v.version ? v.version : '1.0.0.0';
}
function bumpVersion(v) {
  // a.b.c.d → 构建时 c+1, d+1
  const parts = v.split('.').map(Number);
  if (parts.length !== 4) parts.push(0, 0, 0, 0).slice(-4);
  parts[2] = (parts[2] || 0) + 1;
  parts[3] = (parts[3] || 0) + 1;
  return parts.join('.');
}

/* ---------- 扫描内容 ---------- */

/** 校验 photos 引用的文件都存在，返回带 exists 标记的 albums */
function scanPhotos(profile) {
  const albums = (profile.photos && profile.photos.albums) || [];
  return albums.map(al => {
    const items = (al.items || []).map(it => {
      const p = path.join(ROOT, it.src || '');
      const exists = fs.existsSync(p);
      if (!exists) console.error('  ⚠ 照片不存在: ' + (it.src || '(空)'));
      return Object.assign({}, it, { exists });
    });
    return Object.assign({}, al, { items, count: items.length });
  });
}

/** 校验歌单音频文件存在 */
function scanMusic(profile) {
  const tracks = (profile.playlist && profile.playlist.tracks) || [];
  return tracks.map(t => {
    const p = path.join(ROOT, t.src || '');
    const exists = fs.existsSync(p);
    if (!exists) console.error('  ⚠ 音频不存在: ' + (t.src || '(空)'));
    return Object.assign({}, t, { exists });
  });
}

/** 统计相册照片总数 */
function totalPhotos(albums) {
  return albums.reduce((s, al) => s + (al.items || []).length, 0);
}

/* ---------- 主体 ---------- */
console.log('▶ 构建情侣空间网站...');

const profile = readJSON(path.join(CONTENT, 'profile.json'));
if (!profile) { console.error('✖ 缺少 profile.json'); process.exit(1); }

const version = bumpVersion(readVersion());
writeFile(path.join(CONTENT, 'version.json'), JSON.stringify({ version }, null, 0) + '\n');

const albums = scanPhotos(profile);
const tracks = scanMusic(profile);

const site = {
  version,
  profile: stripUnderscore(profile),
  photos: albums,
  music: tracks,
  stats: {
    days: 0, // 前端计算纪念日天数
    photos: totalPhotos(albums),
    albums: albums.length,
    stories: ((profile.stories && profile.stories.items) || []).length,
    tracks: tracks.length
  },
  builtAt: new Date().toISOString()
};

// 计算已在一起天数（写入构建时快照，前端也实时算）
const ann = profile.site && profile.site.anniversary;
if (ann) {
  const t0 = new Date(ann).getTime();
  site.stats.days = Math.max(0, Math.floor((Date.now() - t0) / 86400000));
}

writeFile(OUT_JSON, JSON.stringify(site, null, 2) + '\n');
writeFile(OUT_JS,
  '// 自动生成，勿手改——运行 构建网站.bat 重新生成\n' +
  'window.SITE_DATA = ' + JSON.stringify(site, null, 2) + ';\n'
);

console.log('✔ 完成  版本 ' + version +
  '  相册 ' + albums.length + ' 个 / ' + site.stats.photos + ' 张  故事 ' + site.stats.stories +
  ' 条  歌曲 ' + tracks.length + ' 首');