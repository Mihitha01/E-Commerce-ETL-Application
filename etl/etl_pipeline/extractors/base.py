from abc import ABC, abstractmethod

import pandas as pd


class BaseExtractor(ABC):
    """Strategy interface for all file extractors."""

    @abstractmethod
    def extract(self, file_path: str) -> pd.DataFrame:
        """Read a file and return a dataframe."""
        raise NotImplementedError
