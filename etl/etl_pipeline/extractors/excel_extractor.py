import pandas as pd

from .base import BaseExtractor


class ExcelExtractor(BaseExtractor):
    """Extract data from Excel files using pandas."""

    def __init__(self, sheet_name: str | int = 0) -> None:
        self.sheet_name = sheet_name

    def extract(self, file_path: str) -> pd.DataFrame:
        return pd.read_excel(file_path, sheet_name=self.sheet_name)
