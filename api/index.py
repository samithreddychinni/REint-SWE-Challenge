from pathlib import Path
import sys
from urllib.parse import parse_qs

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app as fastapi_app


async def app(scope, receive, send):
    if scope["type"] == "http" and scope.get("path") in ("/api/index.py", "/api/index"):
        qs = parse_qs(scope.get("query_string", b"").decode("utf-8"))
        subpath = qs.get("_path", [""])[0].lstrip("/")
        if subpath:
            scope = dict(scope)
            scope["path"] = f"/api/{subpath}"
            scope["raw_path"] = scope["path"].encode("utf-8")
    await fastapi_app(scope, receive, send)
