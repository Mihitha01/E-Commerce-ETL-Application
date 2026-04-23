from typing import Sequence

import pandas as pd

from .base import BaseExtractor


class CsvExtractor(BaseExtractor):
    """Extract data from CSV files using pandas."""

    def __init__(self, columns: Sequence[str] | None = None) -> None:
        self.columns = list(columns) if columns else None

    def extract(self, file_path: str) -> pd.DataFrame:
        return pd.read_csv(file_path, usecols=self.columns, low_memory=False)
