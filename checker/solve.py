"""Checker script for Panorama Trace Mission.

The checker walks through each challenge, sends the exact winning
coordinates, and prints out the concatenated flag. The base URL can be
overridden via the PTM_URL environment variable (defaults to the publicly
deployed instance).
"""

from __future__ import annotations

import os
import sys
from typing import Dict, Iterable, Tuple

import requests


DEFAULT_URL = "default.panorama-trace-mission.ctfcompetition.com/"

# category → challenge → (latitude, longitude)
CHALLENGES: Dict[str, Dict[str, Tuple[float, float]]] = {
	"easy": {
		"one": (0, 0),
	},
	"second": {
		"two": (0, 0),
	},
	"third": {
		"three": (0, 0),
	},
	"fourth": {
		"four": (0, 0),
	},
}


def normalise_base_url() -> str:
	"""Return the challenge base URL with a single trailing slash."""

	base = os.getenv("PTM_URL", DEFAULT_URL).strip()
	if not base:
		raise ValueError("Base URL is empty; set PTM_URL or update DEFAULT_URL.")
	if not base.endswith("/"):
		base += "/"
	return base


def fetch_flag_segment(session: requests.Session, base_url: str, competition: str, challenge: str,
						coords: Tuple[float, float]) -> str:
	"""Submit the solved coordinates for a challenge and return the flag fragment."""

	# Warm up: load the challenge page so the session mimics a real player.
	challenge_path = f"{competition}-{challenge}"
	challenge_url = base_url + challenge_path
	response = session.get(challenge_url, timeout=10)
	response.raise_for_status()

	submit_url = f"{challenge_url}/submit"
	payload = list(coords)
	response = session.post(submit_url, json=payload, timeout=10)
	response.raise_for_status()

	body = response.text.strip()
	# Most responses end with the flag fragment, so we grab the last token even if
	# the message does not explicitly mention the word "flag".
	parts = body.split()
	if not parts:
		raise RuntimeError(f"Empty response for {challenge_path}")

	return parts[-1]


def collect_flag_fragments() -> Iterable[str]:
	base_url = normalise_base_url()

	with requests.Session() as session:
		# Hit the homepage once to prime any session cookies or caches.
		response = session.get(base_url, timeout=10)
		response.raise_for_status()

		for competition, challenges in CHALLENGES.items():
			for challenge, coords in challenges.items():
				yield fetch_flag_segment(session, base_url, competition, challenge, coords)


def main() -> None:
	try:
		flag = "".join(collect_flag_fragments())
		print(flag)
	except Exception as exc:  # pragma: no cover - checker should always fail noisily
		print(f"[checker] error: {exc}", file=sys.stderr)
		sys.exit(1)


if __name__ == "__main__":
	main()