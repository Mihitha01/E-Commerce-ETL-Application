"""Command-line entry point for the strategy-based ETL pipeline."""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
import sys

from etl_pipeline.extractors import CsvExtractor, ExcelExtractor, NdjsonExtractor
from etl_pipeline.loaders import MongoLoader, SqlLoader
from etl_pipeline.pipeline import ETLPipeline
from etl_pipeline.transformers import DataTransformer


LOGGER = logging.getLogger(__name__)

DEFAULT_COLUMNS = [
    "Order ID",
    "Date",
    "Status",
    "SKU",
    "Category",
    "Qty",
    "Amount",
    "ship-city",
    "ship-state",
    "promotion-ids",
]


def parse_args() -> argparse.Namespace:
    """Parse runtime ETL settings from command-line arguments."""
    parser = argparse.ArgumentParser(description="Run enterprise ETL pipeline")
    parser.add_argument(
        "--file-path",
        default="data/Amazon Sale Report.csv",
        help="Path to source file (csv, ndjson, or excel)",
    )
    parser.add_argument(
        "--extractor",
        choices=["csv", "ndjson", "excel"],
        default="csv",
        help="Extraction strategy",
    )
    parser.add_argument(
        "--loader",
        choices=["mongo", "sql", "postgres"],
        default="mongo",
        help="Load strategy",
    )
    parser.add_argument(
        "--sheet-name",
        default="0",
        help="Excel sheet name or index (used only for excel extractor)",
    )
    parser.add_argument(
        "--mongo-uri",
        default="mongodb://localhost:27017/",
        help="MongoDB connection URI",
    )
    parser.add_argument(
        "--mongo-db",
        default="AmazonSalesDB",
        help="MongoDB database name",
    )
    parser.add_argument(
        "--mongo-collection",
        default="sales_report",
        help="MongoDB collection name",
    )
    parser.add_argument(
        "--sql-connection-string",
        default="sqlite:///etl_pipeline.db",
        help="SQLAlchemy connection string",
    )
    parser.add_argument(
        "--sql-table",
        default="sales_report",
        help="Target SQL table name",
    )
    parser.add_argument(
        "--output-json",
        action="store_true",
        help="Print run summary as JSON to stdout",
    )
    return parser.parse_args()


def _parse_sheet_name(raw_sheet_name: str) -> str | int:
    if raw_sheet_name.isdigit():
        return int(raw_sheet_name)
    return raw_sheet_name


def build_extractor(args: argparse.Namespace):
    """Build extraction strategy from CLI options."""
    if args.extractor == "csv":
        return CsvExtractor(columns=DEFAULT_COLUMNS)
    if args.extractor == "ndjson":
        return NdjsonExtractor()
    return ExcelExtractor(sheet_name=_parse_sheet_name(args.sheet_name))


def build_loader(args: argparse.Namespace):
    """Build loading strategy from CLI options."""
    if args.loader == "mongo":
        return MongoLoader(
            mongo_uri=args.mongo_uri,
            database_name=args.mongo_db,
            collection_name=args.mongo_collection,
        )

    return SqlLoader(
        connection_string=args.sql_connection_string,
        table_name=args.sql_table,
        if_exists="replace",
    )


def main() -> None:
    """Run the ETL pipeline with selected strategies."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    args = parse_args()

    source_path = Path(args.file_path)
    if not source_path.exists():
        raise FileNotFoundError(f"Source file not found: {source_path}")

    pipeline = ETLPipeline(
        extractor=build_extractor(args),
        transformer=DataTransformer(),
        loader=build_loader(args),
    )

    result = pipeline.run(str(source_path))

    if args.output_json:
        print(json.dumps(result, default=str))
    else:
        LOGGER.info(
            "ETL finished. status=%s extracted=%s valid=%s loaded=%s",
            result.get("status"),
            result.get("extract", {}).get("rowCount"),
            result.get("transform", {}).get("validCount"),
            result.get("load", {}).get("insertedCount"),
        )

    if result.get("status") != "completed":
        sys.exit(1)


if __name__ == "__main__":
    main()
