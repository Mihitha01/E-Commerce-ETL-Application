from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError


def load_data(df, db_name="AmazonSalesDB", collection_name="sales_report"):
    print(f"--- Loading data into MongoDB: {db_name} ---")

    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
    except ServerSelectionTimeoutError:
        print("MongoDB is not reachable at localhost:27017. Start MongoDB and run ETL again.")
        client.close()
        return False

    db = client[db_name]
    collection = db[collection_name]

    collection.delete_many({})
    data_dict = df.to_dict(orient="records")

    if data_dict:
        collection.insert_many(data_dict)
        print(f"Successfully loaded {len(data_dict)} documents into MongoDB.")
    else:
        print("No data to load.")

    client.close()
    return True