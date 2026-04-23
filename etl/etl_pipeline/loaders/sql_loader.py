import pandas as pd
from sqlalchemy import create_engine

from .base import BaseLoader


class SqlLoader(BaseLoader):
    """Load rows into any SQL database supported by SQLAlchemy."""

    def __init__(
        self,
        connection_string: str,
        table_name: str,
        if_exists: str = "replace",
    ) -> None:
        self.connection_string = connection_string
        self.table_name = table_name
        self.if_exists = if_exists

    def load(self, dataframe: pd.DataFrame) -> int:
        if dataframe.empty:
            return 0

        engine = create_engine(self.connection_string)
        try:
            dataframe.to_sql(
                name=self.table_name,
                con=engine,
                if_exists=self.if_exists,
                index=False,
            )
            return len(dataframe)
        finally:
            engine.dispose()
