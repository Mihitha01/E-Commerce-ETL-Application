from pymongo import MongoClient

import pandas as pd

from .base import BaseLoader


class MongoLoader(BaseLoader):
    """Load rows into MongoDB."""

    def __init__( #store the "Address" of Where the data needs to be loaded (mongoDB)
        self,
        mongo_uri: str,
        database_name: str,
        collection_name: str,
        clear_collection: bool = True,
    ) -> None:
        self.mongo_uri = mongo_uri
        self.database_name = database_name
        self.collection_name = collection_name
        self.clear_collection = clear_collection

    def load(self, dataframe: pd.DataFrame) -> int:
        rows = dataframe.to_dict(orient="records")
        if not rows:
            return 0

        client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
        try:
            client.admin.command("ping")
            collection = client[self.database_name][self.collection_name]

            if self.clear_collection:
                collection.delete_many({})

            result = collection.insert_many(rows)
            return len(result.inserted_ids)
        finally:
            client.close()
