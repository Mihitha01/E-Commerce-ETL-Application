from extract import extract_data
from transform import transform_data
from load import load_data


def run_etl():
    source_file = "data/Amazon Sale Report.csv"
    raw_data = extract_data(source_file)
    print(f"Extracted {len(raw_data)} rows and {len(raw_data.columns)} columns.")

    transformed_data = transform_data(raw_data)
    print(f"Transformed data shape: {transformed_data.shape}")

    loaded = load_data(transformed_data)
    if loaded:
        print("--- ETL Job Finished Successfully ---")
    else:
        print("--- ETL Job Stopped At Load Step ---")


if __name__ == "__main__":
    run_etl()
