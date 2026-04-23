import logging
import time
from dataclasses import dataclass
from typing import Any

import pandas as pd


LOGGER = logging.getLogger(__name__)


class RowValidationError(ValueError):
    """Validation error scoped to one column in one row."""

    def __init__(self, field: str, message: str) -> None:
        super().__init__(message)
        self.field = field
        self.message = message


@dataclass
class TransformResult:
    """Output payload from transformation step."""

    dataframe: pd.DataFrame
    errors: list[dict[str, Any]]
    stats: dict[str, Any]


class DataTransformer:
    """Validate and normalize rows, dropping only invalid records."""

    REQUIRED_COLUMNS = [
        "Order ID",
        "Date",
        "Status",
        "SKU",
        "Category",
        "Qty",
        "Amount",
        "ship-city",
        "ship-state",
    ]

    def transform(self, dataframe: pd.DataFrame) -> TransformResult:
        """Apply strict validation; invalid rows are logged and skipped."""
        start_time = time.perf_counter()
        self._validate_required_columns(dataframe)

        valid_rows: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for row_index, row in dataframe.iterrows():
            try:
                valid_rows.append(self._validate_and_normalize_row(row))
            except RowValidationError as error:
                LOGGER.warning("Dropping row %s: %s", row_index, error.message)
                errors.append(
                    {
                        "rowIndex": int(row_index),
                        "issues": [
                            {
                                "field": error.field,
                                "message": error.message,
                            }
                        ],
                        "rawData": row.to_dict(),
                    }
                )
            except Exception as error:  # noqa: BLE001
                LOGGER.warning("Dropping row %s: %s", row_index, error)
                errors.append(
                    {
                        "rowIndex": int(row_index),
                        "issues": [
                            {
                                "field": "row",
                                "message": str(error),
                            }
                        ],
                        "rawData": row.to_dict(),
                    }
                )

        transformed_df = pd.DataFrame(valid_rows, columns=self.REQUIRED_COLUMNS)
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        total_input = len(dataframe)
        valid_count = len(transformed_df)
        error_count = len(errors)
        success_rate = "0.0%"
        if total_input > 0:
            success_rate = f"{(valid_count / total_input) * 100:.1f}%"

        stats = {
            "totalInput": total_input,
            "validCount": valid_count,
            "errorCount": error_count,
            "successRate": success_rate,
            "durationMs": duration_ms,
        }

        LOGGER.info(
            "Transformation complete. input_rows=%s valid_rows=%s dropped_rows=%s",
            total_input,
            valid_count,
            error_count,
        )
        return TransformResult(dataframe=transformed_df, errors=errors, stats=stats)

    def _validate_required_columns(self, dataframe: pd.DataFrame) -> None:
        missing_columns = [
            column for column in self.REQUIRED_COLUMNS if column not in dataframe.columns
        ]
        if missing_columns:
            raise RowValidationError("columns", f"Missing required columns: {missing_columns}")

    def _validate_and_normalize_row(self, row: pd.Series) -> dict[str, Any]:
        order_id = self._require_non_empty_text(row, "Order ID")
        status = self._require_non_empty_text(row, "Status")
        sku = self._require_non_empty_text(row, "SKU")
        category = self._require_non_empty_text(row, "Category")
        ship_city = self._require_non_empty_text(row, "ship-city").upper()
        ship_state = self._require_non_empty_text(row, "ship-state")

        parsed_date = pd.to_datetime(row["Date"], errors="coerce")
        if pd.isna(parsed_date):
            raise RowValidationError("Date", "Date must be a valid date")

        qty = pd.to_numeric(row["Qty"], errors="coerce")
        if pd.isna(qty) or qty < 0:
            raise RowValidationError("Qty", "Qty must be a non-negative number")

        amount = pd.to_numeric(row["Amount"], errors="coerce")
        if pd.isna(amount) or amount < 0:
            raise RowValidationError("Amount", "Amount must be a non-negative number")

        return {
            "Order ID": order_id,
            "Date": parsed_date,
            "Status": status,
            "SKU": sku,
            "Category": category,
            "Qty": int(qty),
            "Amount": float(amount),
            "ship-city": ship_city,
            "ship-state": ship_state,
        }

    @staticmethod
    def _require_non_empty_text(row: pd.Series, column_name: str) -> str:
        value = row[column_name]
        if pd.isna(value):
            raise RowValidationError(column_name, f"{column_name} cannot be null")

        cleaned = str(value).strip()
        if not cleaned:
            raise RowValidationError(column_name, f"{column_name} cannot be empty")

        return cleaned
