import pandas as pd

from .base import BaseExtractor


class NdjsonExtractor(BaseExtractor):
    """Extract data from NDJSON files using pandas."""

    def extract(self, file_path: str) -> pd.DataFrame:
        return pd.read_json(file_path, lines=True)
