#!/usr/bin/env python3
"""Sincroniza el catálogo público con los videos largos de YouTube.

Requisitos: YOUTUBE_API_KEY (secreto de GitHub) y, opcionalmente,
YOUTUBE_CHANNEL_HANDLE (por defecto @Contenidoarchivistico).
Conserva la clasificación archivística y los videos existentes, aunque
desaparezcan de la API. No publica información privada ni usa OAuth.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import date
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalogo-audiovisual.html"
PROJECT_PAGE = ROOT / "contenido-archivistico.html"
MARKER = "const VIDEOS="
BASE_URL = "https://www.googleapis.com/youtube/v3/"
MIN_NEW_VIDEO_SECONDS = 181  # Los Shorts pueden durar hasta tres minutos.
VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
DURATION_RE = re.compile(r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$")


def youtube_api(key: str, endpoint: str, **parameters: object) -> dict:
    url = BASE_URL + endpoint + "?" + urlencode({**parameters, "key": key})
    request = Request(url, headers={"User-Agent": "ContenidoArchivisticoCatalog/1.0"})
    try:
        with urlopen(request, timeout=30) as response:
            return json.load(response)
    except HTTPError as error:
        try:
            body = json.loads(error.read().decode("utf-8", errors="replace"))
            detail = body.get("error", {}).get("message", "Solicitud no aceptada")
        except (ValueError, AttributeError):
            detail = "Solicitud no aceptada"
        raise RuntimeError(f"YouTube devolvió HTTP {error.code}: {detail}") from None
    except (URLError, TimeoutError):
        raise RuntimeError("No fue posible conectar con YouTube Data API.") from None


def get_channel_uploads(key: str, handle: str) -> list[dict]:
    channel = youtube_api(key, "channels", part="contentDetails", forHandle=handle).get("items", [])
    if len(channel) != 1:
        raise RuntimeError(f"No encontré un canal único para {handle}. Revisa YOUTUBE_CHANNEL_HANDLE.")
    playlist_id = channel[0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
    if not playlist_id:
        raise RuntimeError("YouTube no devolvió la lista de videos publicados del canal.")

    identifiers: list[str] = []
    page_token = ""
    while True:
        args: dict[str, object] = {"part": "contentDetails", "playlistId": playlist_id, "maxResults": 50}
        if page_token:
            args["pageToken"] = page_token
        response = youtube_api(key, "playlistItems", **args)
        for item in response.get("items", []):
            video_id = item.get("contentDetails", {}).get("videoId", "")
            if VIDEO_ID_RE.fullmatch(video_id):
                identifiers.append(video_id)
        page_token = response.get("nextPageToken", "")
        if not page_token:
            break
        if len(identifiers) > 5000:
            raise RuntimeError("La lista de YouTube excede el límite de seguridad.")

    if not identifiers:
        raise RuntimeError("La API no devolvió videos; no se modificó el catálogo.")

    result: list[dict] = []
    for i in range(0, len(identifiers), 50):
        response = youtube_api(
            key, "videos",
            part="snippet,contentDetails",
            id=",".join(identifiers[i : i + 50]),
            maxResults=50,
        )
        result.extend(response.get("items", []))
    if not result:
        raise RuntimeError("No se obtuvieron detalles de videos públicos; sin modificaciones.")
    return result


def seconds_from_duration(value: str) -> int:
    match = DURATION_RE.fullmatch(value)
    if not match:
        return 0
    days, hours, minutes, seconds = (int(x or 0) for x in match.groups())
    return days * 86400 + hours * 3600 + minutes * 60 + seconds


def load_catalog() -> tuple[str, list[dict], str]:
    html = CATALOG.read_text(encoding="utf-8")
    pos = html.find(MARKER)
    if pos < 0:
        raise RuntimeError("No encontré la variable VIDEOS del catálogo.")
    value_start = pos + len(MARKER)
    videos, consumed = json.JSONDecoder().raw_decode(html[value_start:])
    value_end = value_start + consumed
    if not isinstance(videos, list) or not html[value_end:].startswith(";"):
        raise RuntimeError("El inventario VIDEOS no tiene un formato compatible.")
    return html[:value_start], videos, html[value_end:]


def update_videos(videos: list[dict], youtube_videos: list[dict]) -> tuple[int, int]:
    by_id = {v.get("video_id"): v for v in videos if v.get("video_id")}
    if len(by_id) != len([v for v in videos if v.get("video_id")]):
        raise RuntimeError("Hay identificadores duplicados en el inventario.")
    next_id = max((int(v["id"]) for v in videos), default=0)
    added = 0
    retitled = 0

    # Conservar todos los registros y metadatos archivísticos existentes.
    for video in youtube_videos:
        vid = video.get("id", "")
        snippet = video.get("snippet", {})
        title = snippet.get("title", "").strip()
        if not VIDEO_ID_RE.fullmatch(vid) or not title or title in ("Private video", "Deleted video"):
            continue
        current = by_id.get(vid)
        if current is not None:
            if current.get("titulo_original") != title:
                current["titulo_original"] = title
                retitled += 1
            continue

        duration = seconds_from_duration(video.get("contentDetails", {}).get("duration", ""))
        if duration < MIN_NEW_VIDEO_SECONDS:
            continue
        published = snippet.get("publishedAt", "")[:10]
        try:
            published_day = date.fromisoformat(published)
        except (TypeError, ValueError):
            continue
        next_id += 1
        item = {
            "id": next_id,
            "titulo_original": title,
            "titulo_propuesto": title,
            "invitados": [],
            "temas": [],
            "paises": [],
            "fecha": published_day.isoformat(),
            "anio": published_day.year,
            "youtube": "https://www.youtube.com/watch?v=" + vid,
            "video_id": vid,
            "spotify": None,
            "tipo": "Por clasificar",
            "miniatura_nueva": False,
            "idioma": "",
        }
        videos.append(item)
        by_id[vid] = item
        added += 1
    return added, retitled


def save_catalog(prefix: str, videos: list[dict], suffix: str) -> None:
    data = json.dumps(videos, ensure_ascii=False, separators=(",", ":"))
    # El inventario está dentro de <script>, por lo que no debe cerrar esa etiqueta.
    data = data.replace("&", r"\u0026").replace("<", r"\u003c").replace(">", r"\u003e")
    catalog_text = prefix + data + suffix
    if CATALOG.read_text(encoding="utf-8") != catalog_text:
        CATALOG.write_text(catalog_text, encoding="utf-8")


def sync_project_total(total: int) -> None:
    if not PROJECT_PAGE.exists():
        return
    html = PROJECT_PAGE.read_text(encoding="utf-8")
    html, count1 = re.subn(
        r'(<strong>)\d+(</strong><span>Videos publicados</span>)',
        lambda m: m.group(1) + str(total) + m.group(2),
        html,
        count=1,
    )
    html, count2 = re.subn(
        r'Explora \d+ entrevistas, conferencias',
        f'Explora {total} entrevistas, conferencias',
        html,
        count=1,
    )
    if count1 != 1 or count2 != 1:
        raise RuntimeError("No se pudo identificar el contador de videos de la página del proyecto.")
    if PROJECT_PAGE.read_text(encoding="utf-8") != html:
        PROJECT_PAGE.write_text(html, encoding="utf-8")


def main() -> int:
    key = os.getenv("YOUTUBE_API_KEY", "").strip()
    handle = os.getenv("YOUTUBE_CHANNEL_HANDLE", "@Contenidoarchivistico").strip()
    if not key:
        print("Configura YOUTUBE_API_KEY como secreto de GitHub para activar la sincronización.")
        return 2
    prefix, videos, suffix = load_catalog()
    remote = get_channel_uploads(key, handle)
    added, retitled = update_videos(videos, remote)
    save_catalog(prefix, videos, suffix)
    sync_project_total(len(videos))
    print(
        f"Canal {handle}: {len(remote)} videos accesibles; "
        f"{added} agregados (más de 3 minutos), {retitled} títulos actualizados; "
        f"{len(videos)} registros en el catálogo."
    )
    print("Invitados, temas, países y demás clasificación manual conservados.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (RuntimeError, OSError, ValueError) as exc:
        print("ERROR:", exc, file=sys.stderr)
        sys.exit(1)
