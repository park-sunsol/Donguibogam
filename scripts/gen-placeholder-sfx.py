#!/usr/bin/env python3
"""
처방 조제 게임 효과음 placeholder 생성기.

실제 녹음(절구질·종소리 등)으로 교체하기 전까지 무음을 피하기 위한 임시 합성 음원을
asset/sound/ 에 만든다. 파일명은 js/sfx.js 의 SOUND_MAP 과 일치해야 한다.

대상: collect.wav(탕 외 제형 투입), complete.wav(완성)
  ※ grab.mp3 / water_splash.mp3 / boiling_water.mp3 는 실제 mp3 음원(별도 제공) —
    이 스크립트는 mp3를 만들지 않으므로 건드리지 않는다.

사용:  python3 scripts/gen-placeholder-sfx.py
"""
import math
import os
import struct
import wave

SR = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "asset", "sound")


def write_wav(name, samples):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    # 클리핑 방지 정규화
    peak = max(1e-9, max(abs(s) for s in samples))
    norm = 0.9 / peak if peak > 0.9 else 1.0
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = b"".join(
            struct.pack("<h", int(max(-1.0, min(1.0, s * norm)) * 32767)) for s in samples
        )
        w.writeframes(frames)
    print("wrote", os.path.relpath(path))


def tone(freq, dur, decay=8.0, amp=0.6, harmonics=(1.0, 0.4, 0.2)):
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-decay * t)
        s = 0.0
        for k, h in enumerate(harmonics, start=1):
            s += h * math.sin(2 * math.pi * freq * k * t)
        out.append(amp * env * s)
    return out


def mix(*tracks):
    n = max(len(t) for t in tracks)
    out = [0.0] * n
    for t in tracks:
        for i, s in enumerate(t):
            out[i] += s
    return out


def delay(track, seconds):
    return [0.0] * int(SR * seconds) + track


# ── collect: 맑은 종 "딩" (탕 외 제형 투입 피드백) ──
collect = mix(
    tone(880, 0.45, decay=7, amp=0.55),
    tone(1320, 0.45, decay=9, amp=0.30),
)
write_wav("collect.wav", collect)

# ── complete: 완성 축하 — 도·미·솔·도 분산화음(종소리) ──
notes = [523.25, 659.25, 783.99, 1046.50]
tracks = [delay(tone(f, 1.2, decay=4.5, amp=0.5), i * 0.13) for i, f in enumerate(notes)]
complete = mix(*tracks)
write_wav("complete.wav", complete)
