from abc import ABC, abstractmethod

import pandas as pd


class BaseLoader(ABC):
    """Strategy interface for data loading targets."""

    @abstractmethod
    def load(self, dataframe: pd.DataFrame) -> int:
        """Persist a dataframe and return the number of written rows."""
        raise NotImplementedError
