import logging
import time
from typing import Any

from etl_pipeline.extractors.base import BaseExtractor
from etl_pipeline.loaders.base import BaseLoader
from etl_pipeline.transformers.data_transformer import DataTransformer


LOGGER = logging.getLogger(__name__)


class ETLPipeline:
    """Orchestrates extraction, transformation, and loading."""

    def __init__(
        self,
        extractor: BaseExtractor,
        transformer: DataTransformer,
        loader: BaseLoader,
    ) -> None:
        self.extractor = extractor
        self.transformer = transformer
        self.loader = loader

    def run(self, file_path: str) -> dict[str, Any]:
        """Run ETL and return an API-friendly execution summary."""
        pipeline_start = time.perf_counter()
        summary: dict[str, Any] = {
            "filePath": file_path,
            "status": "pending",
            "extract": None,
            "transform": None,
            "load": None,
            "errors": [],
            "durationMs": 0,
        }

        try:
            raw_df = self.extractor.extract(file_path)
            summary["extract"] = {
                "rowCount": len(raw_df),
                "status": "success",
            }

            transform_result = self.transformer.transform(raw_df)
            summary["transform"] = {
                **transform_result.stats,
                "status": "success",
            }
            summary["errors"] = transform_result.errors

            load_start = time.perf_counter()
            inserted_count = self.loader.load(transform_result.dataframe)
            load_duration_ms = int((time.perf_counter() - load_start) * 1000)
            summary["load"] = {
                "insertedCount": inserted_count,
                "durationMs": load_duration_ms,
                "status": "success",
            }

            summary["status"] = "completed"
        except Exception as error:  # noqa: BLE001
            summary["status"] = "failed"
            summary["errors"].append(
                {
                    "issues": [
                        {
                            "field": "pipeline",
                            "message": str(error),
                        }
                    ]
                }
            )
            LOGGER.exception("Pipeline failed: %s", error)
        finally:
            summary["durationMs"] = int((time.perf_counter() - pipeline_start) * 1000)

        LOGGER.info("Pipeline completed with status=%s", summary["status"])
        return summary
