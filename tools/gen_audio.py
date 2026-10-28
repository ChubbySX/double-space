# -*- coding: utf-8 -*-
"""生成情侣空间网站唱片机的 3 首示例曲目（音乐盒风格，柔和怀旧）。
纯 numpy 合成 → wav → ffmpeg 转 mp3。用户之后可用真实歌曲替换 content/music/ 下的文件。
用法: python tools/gen_audio.py
"""
import os, subprocess, numpy as np
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, "content", "music")
os.makedirs(MUSIC, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

SR = 44100

# ---------- 音乐盒音色 ----------
def note(freq, dur, vel=1.0):
    """单音符：基频正弦 + 3 个泛音，指数衰减（八音盒质感）"""
    t = np.arange(int(SR * dur)) / SR
    attack = min(0.012, dur * 0.25)
    env = np.minimum(t / attack, 1.0) * np.exp(-t * 5.5)
    wave = (np.sin(2 * np.pi * freq * t)
            + 0.42 * np.sin(2 * np.pi * freq * 2.01 * t)
            + 0.18 * np.sin(2 * np.pi * freq * 3.02 * t)
            + 0.08 * np.sin(2 * np.pi * freq * 4.05 * t))
    return vel * 0.16 * wave * env

def chord(freqs, dur, vel=0.5):
    mix = np.zeros(int(SR * dur))
    for f in freqs:
        mix += note(f, dur, vel)
    return mix

def render(seq, total):
    """seq: [(start_sec, np_array), ...] → 混音成全长立体声"""
    buf = np.zeros((int(SR * total), 2))
    for start, data in seq:
        i = int(SR * start)
        if i + len(data) > len(buf):
            data = data[: len(buf) - i]
        buf[i:i + len(data), 0] += data
        buf[i:i + len(data), 1] += data
    # 轻柔房间感混响（一阶低通模拟）
    a = 0.35
    y = np.empty_like(buf)
    for ch in (0, 1):
        acc = 0.0
        for i in range(len(buf)):
            acc = a * acc + (1 - a) * buf[i, ch]
            y[i, ch] = acc
    out = y / (np.max(np.abs(y)) + 1e-9) * 0.6
    return (out * 32767).astype(np.int16)

def save_mp3(name, data, seconds):
    wav = os.path.join(MUSIC, "_tmp.wav")
    import wave
    with wave.open(wav, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    mp3 = os.path.join(MUSIC, name)
    subprocess.run([FFMPEG, "-y", "-i", wav, "-b:a", "96k", mp3],
                   capture_output=True)
    os.remove(wav)
    print("  [ok] " + name + "  (%.1f s)" % seconds)

# ---------- 三首曲目 ----------

def track1():
    """《晴天慢慢》 - 温柔 C 大调分解和弦"""
    major = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]
    seq = []
    t = 0.0
    for bar in range(8):
        roots = [C := 130.81, 196.00, 174.61, 146.83]  # C G E D
        root = roots[bar % 4]
        for i, f in enumerate([root * 2, root * 3, root * 4, root * 3]):
            seq.append((t + i * 0.5, note(f, 1.6, 0.9)))
        t += 2.0
    # 结尾和弦
    seq.append((16.0, chord([261.63, 329.63, 392.00], 3.5, 0.55)))
    return render(seq, 20)

def track2():
    """《旋律星》 - 明亮的 G 大调上行琶音"""
    g = [196.00, 246.94, 293.66, 392.00]
    seq = []
    t = 0.0
    for bar in range(8):
        for i, f in enumerate(g):
            seq.append((t + i * 0.35, note(f * 2, 1.2, 0.85)))
        seq.append((t + 1.55, note(392.00, 0.4, 0.7)))
        t += 2.1
    seq.append((17.0, chord([196.00, 246.94, 293.66, 392.00], 3.0, 0.45)))
    return render(seq, 20)

def track3():
    """《胶片里的你》 - 舒缓的 A 小调旋律"""
    a_mel = [440.00, 392.00, 349.23, 293.66, 349.23, 392.00, 440.00]
    seq = []
    t = 0.0
    for bar in range(6):
        for i, f in enumerate(a_mel):
            seq.append((t + i * 0.45, note(f, 1.5, 0.8)))
        t += 3.4
    seq.append((20.4, chord([220.00, 261.63, 329.63], 4.0, 0.5)))
    return render(seq, 25)

def main():
    print("生成唱片机示例曲目（音乐盒风格）...")
    save_mp3("track1.mp3", track1(), 20)
    save_mp3("track2.mp3", track2(), 20)
    save_mp3("track3.mp3", track3(), 25)
    print("完成：3 首示例曲目")

if __name__ == "__main__":
    main()